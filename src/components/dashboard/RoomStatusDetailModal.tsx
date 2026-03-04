import { memo } from 'react';
import { X, Box, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import dryroomIcon from '../../assets/dryroom_icon.webp';
import foldingIcon from '../../assets/folding_icon.webp';
import { XCircle } from 'lucide-react';

const iconBlueFilter = 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1000%) hue-rotate(166deg) brightness(96%) contrast(101%)';

export type RoomStatusType = 'dryroom' | 'folding' | 'reject_room';

interface RoomMetric {
    waiting: number;
    checkin: number;
    checkout: number;
    reject_mati?: number;
}

interface RoomStatusDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomType: RoomStatusType;
    data: RoomMetric;
    lineId?: string;
}

const config = {
    dryroom: {
        title: 'Detail Dryroom',
        icon: dryroomIcon,
        iconFilter: iconBlueFilter,
        gradient: 'from-sky-500 via-sky-600 to-sky-700',
        linkTo: '/dashboard-dryroom',
        linkLabel: 'Buka Dashboard Dryroom',
    },
    folding: {
        title: 'Detail Folding',
        icon: foldingIcon,
        iconFilter: iconBlueFilter,
        gradient: 'from-teal-500 via-teal-600 to-teal-700',
        linkTo: '/dashboard-folding',
        linkLabel: 'Buka Dashboard Folding',
    },
    reject_room: {
        title: 'Detail Reject Room',
        icon: null,
        gradient: 'from-red-500 via-red-600 to-red-700',
        linkTo: '/reject-room',
        linkLabel: 'Buka Reject Room',
    },
};

const RoomStatusDetailModal = memo(({ isOpen, onClose, roomType, data, lineId }: RoomStatusDetailModalProps) => {
    if (!isOpen) return null;

    const cfg = config[roomType];
    const total = data.waiting + data.checkin + data.checkout + (data.reject_mati ?? 0);

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`bg-gradient-to-r ${cfg.gradient} p-4 flex-shrink-0`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {cfg.icon ? (
                                <img
                                    src={cfg.icon}
                                    alt=""
                                    className="w-10 h-10 object-contain flex-shrink-0"
                                    style={{ filter: cfg.iconFilter }}
                                />
                            ) : (
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <XCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
                                </div>
                            )}
                            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {cfg.title}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    {lineId && (
                        <p className="text-white/90 text-sm mt-1">Line {lineId}</p>
                    )}
                </div>

                {/* Content - Mini dashboard metrics */}
                <div className="p-4 flex flex-col gap-4 bg-gradient-to-br from-slate-50 to-sky-50/30">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl border border-sky-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" strokeWidth={2} />
                                <span className="font-semibold text-slate-700 text-sm">Waiting</span>
                            </div>
                            <p className="text-2xl font-bold text-sky-900">{data.waiting.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-sky-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Box className="w-5 h-5 text-sky-500" strokeWidth={2} />
                                <span className="font-semibold text-slate-700 text-sm">In</span>
                            </div>
                            <p className="text-2xl font-bold text-sky-900">{data.checkin.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-sky-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={2} />
                                <span className="font-semibold text-slate-700 text-sm">Out</span>
                            </div>
                            <p className="text-2xl font-bold text-sky-900">{data.checkout.toLocaleString()}</p>
                        </div>
                    </div>

                    {roomType === 'reject_room' && data.reject_mati !== undefined && (
                        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle className="w-5 h-5 text-red-500" strokeWidth={2} />
                                <span className="font-semibold text-slate-700 text-sm">Reject</span>
                            </div>
                            <p className="text-2xl font-bold text-red-900">{(data.reject_mati ?? 0).toLocaleString()}</p>
                        </div>
                    )}

                    <div className="pt-2 border-t border-slate-200">
                        <p className="text-sm text-slate-600 mb-2">
                            Total: <span className="font-bold text-slate-900">{total.toLocaleString()}</span>
                        </p>
                        <Link
                            to={cfg.linkTo}
                            onClick={onClose}
                            className="inline-flex items-center gap-2 w-full justify-center py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            {cfg.linkLabel}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
});

RoomStatusDetailModal.displayName = 'RoomStatusDetailModal';
export default RoomStatusDetailModal;
