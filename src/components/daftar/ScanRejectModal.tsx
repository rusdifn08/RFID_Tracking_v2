import { memo } from 'react';

interface RejectScannedItem {
    rfid: string;
    timestamp: Date;
    status: 'success' | 'error';
    message?: string;
}

interface ScanRejectModalProps {
    isOpen: boolean;
    rejectRfidInput: string;
    rejectScannedItems: RejectScannedItem[];
    isProcessingReject: boolean;
    rejectInputRef: React.RefObject<HTMLInputElement | null>;
    onClose: () => void;
    onRfidInputChange: (value: string) => void;
    onRfidKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const ScanRejectModal = memo(({
    isOpen,
    rejectRfidInput,
    rejectScannedItems,
    isProcessingReject,
    rejectInputRef,
    onClose,
    onRfidInputChange,
    onRfidKeyDown,
}: ScanRejectModalProps) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center"
            style={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                animation: 'fadeIn 0.3s ease'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-[95%] max-w-[900px] max-h-[95vh] flex flex-col"
                style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #FEF2F2 100%)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(220, 38, 38, 0.1), 0 8px 16px -8px rgba(239, 68, 68, 0.1)',
                    animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    border: '1px solid rgba(254, 226, 226, 0.8)',
                    padding: '1.5rem',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="text-center mb-2"
                    style={{
                        background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 50%, #FCA5A5 100%)',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
                    }}
                >
                    <h2
                        className="text-xl font-extrabold mb-1"
                        style={{
                            background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '-0.5px'
                        }}
                    >
                        🚫 Scan Reject Mati
                    </h2>
                    <p className="text-sm font-medium" style={{ color: '#7F1D1D' }}>
                        Scan RFID untuk produk garment yang dinyatakan reject mati
                    </p>
                </div>

                <div className="mb-4">
                    <div
                        className="relative"
                        style={{
                            background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                            borderRadius: '12px',
                            padding: '1rem',
                            border: '2px solid #FCA5A5',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                        }}
                    >
                        <label
                            className="block text-sm font-bold mb-2"
                            style={{ color: '#991B1B' }}
                        >
                            Scan RFID Reject:
                        </label>
                        <input
                            ref={rejectInputRef}
                            type="text"
                            value={rejectRfidInput}
                            onChange={(e) => onRfidInputChange(e.target.value)}
                            onKeyDown={onRfidKeyDown}
                            placeholder="Tempatkan RFID di scanner atau ketik manual..."
                            className="w-full px-4 py-3 rounded-lg border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-lg font-mono"
                            style={{
                                background: '#FFFFFF',
                                color: '#1F2937'
                            }}
                            autoFocus
                            disabled={isProcessingReject}
                        />
                    </div>
                </div>

                <div
                    className="flex-1 overflow-y-auto mb-4"
                    style={{
                        background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                        borderRadius: '12px',
                        padding: '1rem',
                        border: '1px solid #FCA5A5',
                        minHeight: '200px',
                        maxHeight: '300px'
                    }}
                >
                    {rejectScannedItems.length === 0 ? (
                        <div className="text-center text-slate-500 text-sm py-8">
                            Belum ada RFID yang di-scan
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {rejectScannedItems.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg"
                                    style={{
                                        background: item.status === 'success' ? '#FEE2E2' : '#FEF2F2',
                                        border: `2px solid ${item.status === 'success' ? '#FCA5A5' : '#FECACA'}`
                                    }}
                                >
                                    <div className="flex-1">
                                        <div className="font-mono font-bold text-sm" style={{ color: '#7F1D1D' }}>
                                            {item.rfid}
                                        </div>
                                        <div className="text-xs" style={{ color: item.status === 'success' ? '#059669' : '#DC2626' }}>
                                            {item.message || (item.status === 'success' ? 'Berhasil' : 'Gagal')}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {item.timestamp.toLocaleTimeString('id-ID')}
                                        </div>
                                    </div>
                                    {item.status === 'success' ? (
                                        <div className="text-green-600">✓</div>
                                    ) : (
                                        <div className="text-red-600">✗</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-sm transition-all"
                    >
                        Tutup
                    </button>
                    <button
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all shadow-lg"
                    >
                        Simpan Reject
                    </button>
                </div>
            </div>
        </div>
    );
});

ScanRejectModal.displayName = 'ScanRejectModal';

export default ScanRejectModal;

