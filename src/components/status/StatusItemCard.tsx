import { memo, useMemo } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Package, Clock } from 'lucide-react';

interface GarmentData {
    buyer: string;
    color: string;
    id_garment: number;
    isDone: string;
    isMove: string;
    item: string;
    rfid_garment: string;
    size: string;
    style: string;
    timestamp: string;
    updated: string;
    wo: string;
}

interface RFIDStatusItem {
    rfid: string;
    timestamp: Date;
    status: 'found' | 'not_found' | 'checking';
    details?: string;
    garment?: GarmentData;
    message?: string;
}

interface StatusItemCardProps {
    item: RFIDStatusItem;
    index: number;
}

const StatusItemCard = memo(({ item, index }: StatusItemCardProps) => {
    const parseTimestamp = useMemo(() => {
        return (timestamp: string): string => {
            if (!timestamp) return '-';
            try {
                const date = new Date(timestamp);
                if (isNaN(date.getTime())) return '-';
                return date.toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'UTC'
                });
            } catch (e) {
                return '-';
            }
        };
    }, []);

    return (
        <div
            key={`${item.rfid}-${index}`}
            className="relative p-5 rounded-lg border-2 border-green-500 bg-white hover:bg-green-500 hover:text-white transition-all duration-300"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-50 border border-green-500 hover:bg-white">
                    {item.status === 'found' ? (
                        <CheckCircle2 className="w-7 h-7 text-green-500 hover:text-white" />
                    ) : item.status === 'not_found' ? (
                        <XCircle className="w-7 h-7 text-red-500 hover:text-white" />
                    ) : (
                        <AlertCircle className="w-7 h-7 text-yellow-500 animate-pulse hover:text-white" />
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xl font-bold text-gray-800 hover:text-white">
                            {item.rfid}
                        </span>
                        <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-lg hover:bg-white hover:text-white">
                            {item.timestamp.toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 mb-2 flex-wrap">
                        <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                            item.status === 'found'
                                ? 'bg-green-100 text-green-700 hover:bg-white hover:text-white'
                                : item.status === 'not_found'
                                    ? 'bg-red-100 text-red-700 hover:bg-white hover:text-white'
                                    : 'bg-yellow-100 text-yellow-700 hover:bg-white hover:text-white'
                        }`}>
                            {item.status === 'found' ? '✓ Found' : item.status === 'not_found' ? '✗ Not Found' : '⏳ Checking...'}
                        </span>
                        {item.message && (
                            <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-lg hover:bg-white hover:text-white">
                                💬 {item.message}
                            </span>
                        )}
                    </div>
                    {item.details && (
                        <p className="text-sm text-gray-600 mb-2 hover:text-white">
                            {item.details}
                        </p>
                    )}
                    {item.garment && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="w-5 h-5 text-green-500 hover:text-white" />
                                <h3 className="text-lg font-bold text-gray-800 hover:text-white">Informasi Garment</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {item.garment.wo && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1 hover:text-white font-medium">WO</p>
                                        <p className="text-sm font-bold text-gray-800 hover:text-white">{item.garment.wo}</p>
                                    </div>
                                )}
                                {item.garment.style && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1 hover:text-white font-medium">Style</p>
                                        <p className="text-sm font-bold text-gray-800 hover:text-white">{item.garment.style}</p>
                                    </div>
                                )}
                                {item.garment.buyer && (
                                    <div className="sm:col-span-1 col-span-2">
                                        <p className="text-xs text-gray-500 mb-1 hover:text-white font-medium">Buyer</p>
                                        <p className="text-sm font-bold text-gray-800 hover:text-white truncate" title={item.garment.buyer}>{item.garment.buyer}</p>
                                    </div>
                                )}
                                {item.garment.item && (
                                    <div className="sm:col-span-1 col-span-2">
                                        <p className="text-xs text-gray-500 mb-1 hover:text-white font-medium">Item</p>
                                        <p className="text-sm font-bold text-gray-800 hover:text-white truncate" title={item.garment.item}>{item.garment.item}</p>
                                    </div>
                                )}
                                {item.garment.color && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1 hover:text-white font-medium">Color</p>
                                        <p className="text-sm font-bold text-gray-800 hover:text-white">{item.garment.color}</p>
                                    </div>
                                )}
                                {item.garment.size && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1 hover:text-white font-medium">Size</p>
                                        <p className="text-sm font-bold text-gray-800 hover:text-white">{item.garment.size}</p>
                                    </div>
                                )}
                                {item.garment.id_garment && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1 hover:text-white font-medium">ID Garment</p>
                                        <p className="text-sm font-bold text-gray-800 hover:text-white">{item.garment.id_garment}</p>
                                    </div>
                                )}
                                {item.garment.timestamp && (
                                    <div className="sm:col-span-1 col-span-2">
                                        <p className="text-xs text-gray-500 mb-1 hover:text-white font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Timestamp
                                        </p>
                                        <p className="text-sm font-bold text-gray-800 hover:text-white">{parseTimestamp(item.garment.timestamp)}</p>
                                    </div>
                                )}
                                {item.garment.updated && (
                                    <div className="sm:col-span-1 col-span-2">
                                        <p className="text-xs text-gray-500 mb-1 hover:text-white font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Updated
                                        </p>
                                        <p className="text-sm font-bold text-gray-800 hover:text-white">{parseTimestamp(item.garment.updated)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

StatusItemCard.displayName = 'StatusItemCard';

export default StatusItemCard;

