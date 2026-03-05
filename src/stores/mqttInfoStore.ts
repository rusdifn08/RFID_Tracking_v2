import { create } from 'zustand';

export type MqttInfoRole = 'qc' | 'pqc';

/** Posisi garment dalam alur: OUTPUT → QC → PQC */
export type MqttInfoPayload = 'OUTPUT' | 'QC' | 'PQC';

export interface MqttInfoEvent {
    line: string;
    role: MqttInfoRole;
    payload: MqttInfoPayload;
    at: number;
}

interface MqttInfoState {
    event: MqttInfoEvent | null;
    setEvent: (event: MqttInfoEvent | null) => void;
    clearEvent: () => void;
}

export const useMqttInfoStore = create<MqttInfoState>((set) => ({
    event: null,
    setEvent: (event) => set({ event }),
    clearEvent: () => set({ event: null }),
}));

const STAGE_ORDER: Record<string, number> = { OUTPUT: 0, QC: 1, PQC: 2 };
const STAGE_LABEL: Record<string, string> = { OUTPUT: 'Output', QC: 'QC', PQC: 'PQC' };

/**
 * Teks animasi berdasarkan alur: OUTPUT → QC → PQC.
 * - Topic (role) = stasiun yang mengirim (qc atau pqc).
 * - Payload = posisi garment saat ini (OUTPUT, QC, atau PQC).
 * - Jika payload < role (proses sebelumnya) → "Garment Masih Berada di [payload]".
 * - Jika payload >= role (proses sama atau lebih) → "Garment Sudah Berada di [payload]".
 */
export function getMqttInfoMessage(payload: MqttInfoPayload, role: MqttInfoRole): string {
    const payloadOrder = STAGE_ORDER[payload] ?? 0;
    const roleOrder = STAGE_ORDER[role.toUpperCase()] ?? 0;
    const label = STAGE_LABEL[payload] ?? payload;
    if (payloadOrder < roleOrder) {
        return `Garment Masih Berada di ${label}`;
    }
    return `Garment Sudah Berada di ${label}`;
}
