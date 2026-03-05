import { useEffect, useState } from 'react';
import { useMqttInfoStore, getMqttInfoMessage } from '../stores/mqttInfoStore';
import { Info } from 'lucide-react';

const DISPLAY_DURATION_MS = 2600;
const EXIT_ANIMATION_MS = 320;

interface MqttInfoAnimationProps {
    currentLineId: string | null;
}

export default function MqttInfoAnimation({ currentLineId }: MqttInfoAnimationProps) {
    const event = useMqttInfoStore((s) => s.event);
    const clearEvent = useMqttInfoStore((s) => s.clearEvent);
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const [key, setKey] = useState(0);

    useEffect(() => {
        if (!event) {
            setVisible(false);
            setExiting(false);
            return;
        }
        if (currentLineId != null && event.line !== currentLineId) return;
        setKey(event.at);
        setExiting(false);
        setVisible(true);
        const exitStart = setTimeout(() => setExiting(true), DISPLAY_DURATION_MS);
        const t = setTimeout(() => {
            setVisible(false);
            clearEvent();
        }, DISPLAY_DURATION_MS + EXIT_ANIMATION_MS);
        return () => {
            clearTimeout(exitStart);
            clearTimeout(t);
        };
    }, [event, currentLineId, clearEvent]);

    if (!visible || !event) return null;
    if (currentLineId != null && event.line !== currentLineId) return null;

    const message = getMqttInfoMessage(event.payload, event.role);
    const roleLabel = event.role === 'qc' ? 'QC' : 'PQC';

    return (
        <div
            key={key}
            className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-none p-4"
            aria-live="polite"
        >
            {/* Backdrop: selaras dengan LoginSuccess & dashboard */}
            <div
                className="absolute inset-0 bg-slate-900/25 backdrop-blur-[3px]"
                style={{
                    animation: exiting
                        ? `infoOverlayOut ${EXIT_ANIMATION_MS}ms ease-out forwards`
                        : 'infoOverlayIn 0.3s ease-out forwards',
                }}
            />
            {/* Kartu: tema dashboard — border biru, shadow halus, aksen atas */}
            <div
                className="relative rounded-xl bg-white shadow-xl border border-blue-200/90 overflow-hidden min-w-[300px] max-w-[min(92vw,380px)]"
                style={{
                    animation: exiting
                        ? `infoCardOut ${EXIT_ANIMATION_MS}ms ease-out forwards`
                        : 'infoCardIn 0.4s cubic-bezier(0.34, 1.2, 0.64, 1) forwards',
                    boxShadow: '0 20px 40px -12px rgba(30, 58, 138, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.08)',
                }}
            >
                {/* Aksen strip atas — tema biru dashboard */}
                <div
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"
                    style={{ animation: 'infoAccentIn 0.5s 0.15s ease-out forwards', opacity: 0 }}
                />
                <div className="px-6 pt-6 pb-5 text-center">
                    {/* Icon: lingkaran biru selaras Good QC/PQC */}
                    <div
                        className="flex justify-center mb-4"
                        style={{ animation: 'infoIconIn 0.5s 0.08s cubic-bezier(0.34, 1.2, 0.64, 1) forwards', opacity: 0 }}
                    >
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-100 shadow-inner">
                            <Info className="w-7 h-7 text-blue-600" strokeWidth={2.25} />
                        </div>
                    </div>
                    <p
                        className="text-xs font-medium uppercase tracking-widest text-blue-600/90"
                        style={{ animation: 'infoTextIn 0.35s 0.2s ease-out forwards', opacity: 0 }}
                    >
                        Informasi Garment
                    </p>
                    <p
                        className="text-lg font-semibold text-slate-800 mt-1.5 leading-snug px-1"
                        style={{ animation: 'infoTextIn 0.35s 0.32s ease-out forwards', opacity: 0 }}
                    >
                        {message}
                    </p>
                    <p
                        className="text-xs text-slate-400 mt-2.5 flex items-center justify-center gap-1.5"
                        style={{ animation: 'infoTextIn 0.35s 0.44s ease-out forwards', opacity: 0 }}
                    >
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                            LINE {event.line}
                        </span>
                        <span>·</span>
                        <span>{roleLabel}</span>
                    </p>
                </div>
                {/* Progress bar — biru tema dashboard */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-r-full"
                        style={{ animation: `infoProgressShrink ${DISPLAY_DURATION_MS}ms linear forwards` }}
                    />
                </div>
            </div>
            <style>{`
                @keyframes infoOverlayIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes infoOverlayOut { from { opacity: 1; } to { opacity: 0; } }
                @keyframes infoCardIn {
                    0% { opacity: 0; transform: scale(0.94) translateY(8px); }
                    65% { transform: scale(1.02) translateY(-2px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes infoCardOut {
                    from { opacity: 1; transform: scale(1) translateY(0); }
                    to { opacity: 0; transform: scale(0.96) translateY(4px); }
                }
                @keyframes infoAccentIn {
                    from { opacity: 0; transform: scaleX(0); transform-origin: left; }
                    to { opacity: 1; transform: scaleX(1); transform-origin: left; }
                }
                @keyframes infoIconIn {
                    0% { opacity: 0; transform: scale(0.4); }
                    60% { transform: scale(1.06); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes infoTextIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes infoProgressShrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}
