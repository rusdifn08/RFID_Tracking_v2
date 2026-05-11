import { memo, useCallback, useRef, useState } from 'react';
import { X } from 'lucide-react';
import BarcodeCameraScanner from './BarcodeCameraScanner';

export interface CuttingLabelScanModalProps {
    open: boolean;
    onClose: () => void;
    /** Dipanggil setelah kode terbaca; boleh async; error akan ditampilkan di modal. */
    onBarcodeScanned: (barcode: string) => Promise<void> | void;
}

const CuttingLabelScanModal = memo(({ open, onClose, onBarcodeScanned }: CuttingLabelScanModalProps) => {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const busyRef = useRef(false);

    const handleDetected = useCallback(
        async (code: string) => {
            if (busyRef.current) return;
            busyRef.current = true;
            setBusy(true);
            setErr(null);
            try {
                await onBarcodeScanned(code.trim());
                onClose();
            } catch (e) {
                setErr(e instanceof Error ? e.message : String(e));
            } finally {
                busyRef.current = false;
                setBusy(false);
            }
        },
        [onBarcodeScanned, onClose]
    );

    if (!open) return null;

    const cameraOn = open && !busy;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !busy && onClose()}
            role="presentation"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cutting-scan-title"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
                    <h2 id="cutting-scan-title" className="text-base font-bold">
                        Scan label cutting
                    </h2>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-white/90 hover:bg-white/15 disabled:opacity-50"
                        aria-label="Tutup"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="p-3 sm:p-4 overflow-y-auto flex flex-col gap-3 min-h-0">
                    <p className="text-xs text-slate-600">
                        Arahkan kamera ke <strong>QR code</strong> pada label (contoh kode{' '}
                        <span className="font-mono">BD20260504-566275</span>).
                    </p>

                    <BarcodeCameraScanner compact cameraActive={cameraOn} onDetected={handleDetected} />

                    {busy && (
                        <p className="text-sm text-center text-blue-700 font-medium animate-pulse">
                            Memuat data dari server…
                        </p>
                    )}

                    {err && (
                        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {err}
                        </p>
                    )}

                    <button
                        type="button"
                        disabled={busy}
                        onClick={onClose}
                        className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
});

CuttingLabelScanModal.displayName = 'CuttingLabelScanModal';

export default CuttingLabelScanModal;
