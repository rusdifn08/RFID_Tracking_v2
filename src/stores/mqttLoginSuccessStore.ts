import { create } from 'zustand';

export type LoginSuccessRole = 'qc' | 'pqc';

export interface LoginSuccessEvent {
    line: string;
    role: LoginSuccessRole;
    at: number;
}

interface MqttLoginSuccessState {
    /** Event terakhir untuk animasi (null = tidak tampil). */
    event: LoginSuccessEvent | null;
    setEvent: (event: LoginSuccessEvent | null) => void;
    /** Clear event (dipanggil setelah animasi selesai). */
    clearEvent: () => void;
}

export const useMqttLoginSuccessStore = create<MqttLoginSuccessState>((set) => ({
    event: null,
    setEvent: (event) => set({ event }),
    clearEvent: () => set({ event: null }),
}));
