/**
 * Konfigurasi MQTT Broker saja (animasi login success).
 * - Hanya MQTT broker yang diseragamkan: 10.5.0.106 untuk MJL, MJL2, CLN.
 * - WebSocket aplikasi (wira-dashboard, dll.) TIDAK diubah; tetap pakai api.ts
 *   (getBackendIP / getWSBaseUrl per environment).
 * - getMqttWsUrl dipakai oleh klien MQTT di browser untuk konek ke broker MQTT
 *   (protokol MQTT over WebSocket), bukan WebSocket aplikasi.
 */

const MQTT_BROKER_HOST = '10.5.0.106';

/** Port MQTT broker (TCP). */
export const MQTT_PORT = 1883;

/** Port MQTT broker untuk koneksi dari browser (MQTT over WebSocket). */
export const MQTT_WS_PORT = 8083;

export const getMqttWsUrl = (): string => {
    return `ws://${MQTT_BROKER_HOST}:${MQTT_WS_PORT}`;
};

/** Client ID unik untuk dashboard (browser). */
export const getMqttClientId = (): string => {
    const prefix = 'dashboard_';
    const rand = Math.random().toString(36).slice(2, 10);
    return `${prefix}${rand}`;
};

/** Opsi koneksi sesuai konfigurasi (MQTT 5, timeout, keepalive, auto reconnect). */
export const MQTT_OPTIONS = {
    connectTimeout: 10 * 1000,
    keepalive: 60,
    clean: true,
    reconnectPeriod: 4000,
    protocolVersion: 5 as const,
};
