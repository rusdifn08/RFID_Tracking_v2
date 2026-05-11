import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ScanLine, AlertCircle } from 'lucide-react';
import type { Exception, Result } from '@zxing/library';
import { BrowserCodeReader, BrowserMultiFormatReader } from '@zxing/browser';

const SAME_CODE_COOLDOWN_MS = 1600;

function mediaDevicesUnavailable(): string | null {
    if (typeof navigator === 'undefined') return 'Lingkungan tidak mendukung navigasi.';
    if (!navigator.mediaDevices?.getUserMedia) {
        return 'Browser tidak mendukung getUserMedia (kamera).';
    }
    return null;
}

/** Di banyak HP, http://+IP tidak menampilkan preview meski izin — perlu https atau localhost. */
function insecureLanHint(): string | null {
    if (typeof window === 'undefined') return null;
    const host = window.location.hostname;
    if (!window.isSecureContext && host !== 'localhost' && host !== '127.0.0.1') {
        return 'Kamera di HP biasanya butuh HTTPS atau localhost. Untuk dev: set VITE_DEV_HTTPS=true, buka https://IP:5173, atau isi barcode manual.';
    }
    return null;
}

export interface BarcodeCameraScannerProps {
    onDetected: (rawValue: string) => void;
    className?: string;
    compact?: boolean;
    cameraActive?: boolean;
}

const BarcodeCameraScanner = memo(
    ({ onDetected, className = '', compact = false, cameraActive: cameraActiveProp }: BarcodeCameraScannerProps) => {
        const [internalActive, setInternalActive] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [videoReady, setVideoReady] = useState(false);
        const [lanHint, setLanHint] = useState<string | null>(null);

        const isControlled = compact && cameraActiveProp !== undefined;
        const active = isControlled ? Boolean(cameraActiveProp) : internalActive;

        const videoRef = useRef<HTMLVideoElement>(null);
        const controlsRef = useRef<{ stop: () => void } | null>(null);

        const lastCodeRef = useRef('');
        const lastCodeAtRef = useRef(0);
        const onDetectedRef = useRef(onDetected);
        useEffect(() => {
            onDetectedRef.current = onDetected;
        }, [onDetected]);

        const stopScan = useCallback(() => {
            try {
                controlsRef.current?.stop();
            } catch {
                /* ignore */
            }
            controlsRef.current = null;
            if (videoRef.current) {
                BrowserCodeReader.cleanVideoSource(videoRef.current);
            }
        }, []);

        // iOS / WebKit: atribut playsinline harus ada sebelum stream
        useEffect(() => {
            const v = videoRef.current;
            if (!v) return;
            v.setAttribute('playsinline', 'true');
            v.setAttribute('webkit-playsinline', 'true');
        }, []);

        useEffect(() => {
            if (!active) {
                stopScan();
                setVideoReady(false);
                setLanHint(null);
                return;
            }

            const video = videoRef.current;
            if (!video) return;

            setError(null);
            setLanHint(insecureLanHint());

            const noDevices = mediaDevicesUnavailable();
            if (noDevices) {
                setError(noDevices);
                if (!isControlled) setInternalActive(false);
                return () => stopScan();
            }

            const onVideoReady = () => {
                setVideoReady(true);
                void video.play().catch(() => {});
            };
            video.addEventListener('loadeddata', onVideoReady);
            video.addEventListener('playing', onVideoReady);

            const readerOptions = {
                delayBetweenScanAttempts: 350,
                delayBetweenScanSuccess: 400,
            };

            const decodeCb = (
                result: Result | undefined,
                _err: Exception | undefined,
                controls: { stop: () => void }
            ) => {
                controlsRef.current = controls;
                if (!result) return;
                const raw = result.getText().trim();
                if (!raw) return;
                const now = Date.now();
                if (raw === lastCodeRef.current && now - lastCodeAtRef.current < SAME_CODE_COOLDOWN_MS) {
                    return;
                }
                lastCodeRef.current = raw;
                lastCodeAtRef.current = now;
                onDetectedRef.current(raw);
            };

            let cancelled = false;

            const tryStart = async () => {
                const attempts: Array<() => Promise<{ stop: () => void }>> = [
                    () => {
                        const r = new BrowserMultiFormatReader(undefined, readerOptions);
                        return r.decodeFromVideoDevice(undefined, video, decodeCb);
                    },
                    () => {
                        const r = new BrowserMultiFormatReader(undefined, readerOptions);
                        return r.decodeFromConstraints(
                            { video: { facingMode: { ideal: 'environment' } }, audio: false },
                            video,
                            decodeCb
                        );
                    },
                    () => {
                        const r = new BrowserMultiFormatReader(undefined, readerOptions);
                        return r.decodeFromConstraints({ video: true, audio: false }, video, decodeCb);
                    },
                ];

                let lastErr: unknown;
                for (const run of attempts) {
                    if (cancelled) return;
                    try {
                        const controls = await run();
                        if (!cancelled) {
                            controlsRef.current = controls;
                        }
                        return;
                    } catch (e) {
                        lastErr = e;
                        try {
                            BrowserCodeReader.cleanVideoSource(video);
                        } catch {
                            /* ignore */
                        }
                    }
                }
                if (cancelled) return;
                const err = lastErr instanceof Error ? lastErr : new Error(String(lastErr));
                let errorMsg = err.message || 'Gagal menginisialisasi kamera.';
                if (
                    (err instanceof Error && err.name === 'NotAllowedError') ||
                    err.message.includes('Permission denied')
                ) {
                    errorMsg =
                        'Akses kamera ditolak. Buka pengaturan situs di browser, izinkan Kamera, lalu muat ulang.';
                } else if (
                    (err instanceof Error && err.name === 'NotFoundError') ||
                    err.message.includes('Requested device not found')
                ) {
                    errorMsg = 'Kamera tidak ditemukan di perangkat ini.';
                } else if (err instanceof Error && err.name === 'NotReadableError') {
                    errorMsg = 'Kamera sedang dipakai aplikasi atau tab lain.';
                }
                setError(errorMsg);
                if (!isControlled) setInternalActive(false);
            };

            void tryStart();

            return () => {
                cancelled = true;
                video.removeEventListener('loadeddata', onVideoReady);
                video.removeEventListener('playing', onVideoReady);
                setVideoReady(false);
                stopScan();
            };
        }, [active, stopScan, isControlled]);

        const startCamera = useCallback(() => {
            setError(null);
            setInternalActive(true);
        }, []);

        const stopCamera = useCallback(() => {
            setInternalActive(false);
        }, []);

        const showToolbar = !compact;

        return (
            <div className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col ${className}`}>
                {lanHint && (
                    <div className="text-[11px] sm:text-xs text-amber-900 bg-amber-50 border-b border-amber-100 px-3 py-2">
                        {lanHint}
                    </div>
                )}

                {showToolbar && (
                    <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                            <ScanLine width={18} height={18} className="text-blue-600 shrink-0" />
                            <span>Scan Barcode / QR</span>
                        </div>
                        {!active ? (
                            <button
                                type="button"
                                onClick={startCamera}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Camera width={16} height={16} />
                                Buka Kamera
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={stopCamera}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition-colors shadow-sm"
                            >
                                <CameraOff width={16} height={16} />
                                Matikan
                            </button>
                        )}
                    </div>
                )}

                <div
                    className={`relative bg-slate-900 w-full overflow-hidden ${
                        compact ? 'min-h-[220px] aspect-[4/3] max-h-[min(55vh,480px)]' : 'min-h-[200px] aspect-video max-h-[300px]'
                    }`}
                >
                    <video
                        ref={videoRef}
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        playsInline
                        muted
                    />

                    {(!active || !videoReady) && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-900/90 text-center px-4 pointer-events-none">
                            <Camera className="text-white/70 shrink-0" width={40} height={40} />
                            <div className="text-sm text-white/90 font-medium">
                                {!active
                                    ? "Kamera mati. Tekan 'Buka Kamera' untuk memulai scan."
                                    : 'Menyambungkan kamera…'}
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="flex items-start gap-2 bg-rose-50 p-3 border-t border-rose-100 text-rose-800 text-sm">
                        <AlertCircle width={18} height={18} className="shrink-0 mt-0.5 text-rose-600" />
                        <div>
                            <span className="font-semibold block mb-1">Gagal Membuka Kamera</span>
                            {error}
                            <span className="block mt-2 text-xs text-rose-600 font-medium">
                                Alternatif: ketik barcode di halaman lalu klik Ambil data.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

BarcodeCameraScanner.displayName = 'BarcodeCameraScanner';

export default BarcodeCameraScanner;
