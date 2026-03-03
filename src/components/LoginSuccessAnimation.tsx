import { useEffect, useState } from 'react';
import { useMqttLoginSuccessStore } from '../stores/mqttLoginSuccessStore';
import { CheckCircle2 } from 'lucide-react';

const DISPLAY_DURATION_MS = 2000;
const EXIT_ANIMATION_MS = 280;

interface LoginSuccessAnimationProps {
    currentLineId: string | null;
}

export default function LoginSuccessAnimation({ currentLineId }: LoginSuccessAnimationProps) {
    const event = useMqttLoginSuccessStore((s) => s.event);
    const clearEvent = useMqttLoginSuccessStore((s) => s.clearEvent);
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
        if (typeof console !== 'undefined' && console.log) {
            console.log('[MQTT Login] Animasi ditampilkan:', event.role === 'qc' ? 'QC' : 'PQC', 'Login Successful, LINE', event.line);
        }
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

    const label = event.role === 'qc' ? 'QC Login Successful' : 'PQC Login Successful';

    return (
        <div
            key={key}
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4"
            aria-live="polite"
        >
            {/* Backdrop: fade in → fade out */}
            <div
                className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
                style={{
                    animation: exiting
                        ? `loginOverlayOut ${EXIT_ANIMATION_MS}ms ease-in forwards`
                        : 'loginOverlayIn 0.2s ease-out forwards',
                }}
            />
            {/* Kartu: scale + fade in → scale down + fade out */}
            <div
                className="relative rounded-xl bg-white shadow-lg border border-slate-200/90 px-6 py-5 text-center min-w-[280px] max-w-[90vw]"
                style={{
                    animation: exiting
                        ? `loginCardOut ${EXIT_ANIMATION_MS}ms ease-in forwards`
                        : 'loginCardIn 0.35s cubic-bezier(0.34, 1.2, 0.64, 1) forwards',
                }}
            >
                {/* Icon: scale in + pulse ringan */}
                <div className="flex justify-center mb-3">
                    <div
                        className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 border border-blue-100 login-icon-wrap"
                        style={{ animation: 'loginIconIn 0.45s 0.1s cubic-bezier(0.34, 1.2, 0.64, 1) forwards', opacity: 0 }}
                    >
                        <CheckCircle2
                            className="w-8 h-8 text-blue-600 login-check"
                            strokeWidth={2}
                            style={{ animation: 'loginCheckIn 0.3s 0.35s ease-out forwards', opacity: 0 }}
                        />
                    </div>
                </div>
                <p
                    className="text-lg font-semibold text-slate-800 tracking-tight login-title"
                    style={{ animation: 'loginTextIn 0.3s 0.25s ease-out forwards', opacity: 0 }}
                >
                    {label}
                </p>
                <p
                    className="text-sm text-slate-500 mt-0.5 login-sub"
                    style={{ animation: 'loginTextIn 0.3s 0.35s ease-out forwards', opacity: 0 }}
                >
                    Authentication successful
                </p>
                <p
                    className="text-xs text-slate-400 mt-2 login-line"
                    style={{ animation: 'loginTextIn 0.3s 0.45s ease-out forwards', opacity: 0 }}
                >
                    LINE {event.line} · Active
                </p>
                {/* Progress bar: habis dalam 2 detik */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-slate-100 overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-b-xl login-progress"
                        style={{ animation: `loginProgressShrink ${DISPLAY_DURATION_MS}ms linear forwards` }}
                    />
                </div>
            </div>
            <style>{`
                @keyframes loginOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes loginOverlayOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes loginCardIn {
                    0% { opacity: 0; transform: scale(0.9); }
                    70% { transform: scale(1.02); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes loginCardOut {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0; transform: scale(0.96); }
                }
                @keyframes loginIconIn {
                    0% { opacity: 0; transform: scale(0.3); }
                    70% { transform: scale(1.08); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes loginCheckIn {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes loginTextIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes loginProgressShrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}
