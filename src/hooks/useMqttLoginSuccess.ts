/**
 * Event login success (QC/PQC) untuk animasi di dashboard.
 *
 * Arsitektur:
 * - MQTT hanya di server (server.js): konek ke broker mqtt://10.5.0.106:1883 (TCP),
 *   subscribe & terima pesan, simpan event terakhir.
 * - Browser tidak bisa konek langsung ke MQTT port 1883 (browser hanya HTTP/WebSocket).
 * - Dashboard dapat event lewat polling: GET /api/mqtt-login-success ke server (proxy).
 */

import { useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useMqttLoginSuccessStore } from '../stores/mqttLoginSuccessStore';

const log = (msg: string, ...args: unknown[]) => {
    if (typeof console !== 'undefined' && console.log) {
        console.log(`[MQTT Login] ${msg}`, ...args);
    }
};

/** Polling event login dari server. Server dapat event dari MQTT (port 1883), frontend ambil lewat API. */
export function useMqttLoginSuccessPolling(currentLineId: string | null): void {
    const setEvent = useMqttLoginSuccessStore((s) => s.setEvent);

    useEffect(() => {
        if (!currentLineId) return;

        log('Polling aktif untuk LINE', currentLineId, '→', `${API_BASE_URL}/api/mqtt-login-success`);

        const poll = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/mqtt-login-success`, { method: 'GET' });
                const data = await res.json().catch(() => ({}));
                if (data?.success && data?.event && data.event.line === currentLineId) {
                    setEvent({
                        line: data.event.line,
                        role: data.event.role,
                        at: data.event.at ?? Date.now(),
                    });
                    log('Event dari server (MQTT) → animasi', data.event);
                }
            } catch (_) {}
        };

        poll();
        const interval = setInterval(poll, 1500);
        return () => clearInterval(interval);
    }, [currentLineId, setEvent]);
}

/** Tidak dipakai: MQTT hanya jalan di server. Tetap export agar pemanggil tidak error. */
export function useMqttLoginSuccess(): void {
    // No-op: browser tidak konek ke MQTT; server.js yang subscribe ke broker (port 1883).
}
