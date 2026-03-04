import { create } from 'zustand';

export type LoginSuccessRole = 'qc' | 'pqc';

export interface LoginSuccessEvent {
    line: string;
    role: LoginSuccessRole;
    at: number;
}

export type LoginLedStatus = 'success' | 'unsuccess';

export interface LedStatusEntry {
    status: LoginLedStatus;
    at: number;
}

export interface LedStatusByRole {
    qc: LedStatusEntry | null;
    pqc: LedStatusEntry | null;
}

interface MqttLoginSuccessState {
    /** Event terakhir untuk animasi (null = tidak tampil). */
    event: LoginSuccessEvent | null;
    setEvent: (event: LoginSuccessEvent | null) => void;
    /** Clear event (dipanggil setelah animasi selesai). */
    clearEvent: () => void;
    /** Status login per role untuk LED Good QC / Good PQC (untuk line yang sedang dipolling). */
    ledStatus: LedStatusByRole;
    setLedStatus: (ledStatus: LedStatusByRole) => void;
}

export const useMqttLoginSuccessStore = create<MqttLoginSuccessState>((set) => ({
    event: null,
    setEvent: (event) => set({ event }),
    clearEvent: () => set({ event: null }),
    ledStatus: { qc: null, pqc: null },
    setLedStatus: (ledStatus) => set({ ledStatus }),
}));
