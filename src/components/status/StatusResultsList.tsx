import { memo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import StatusItemCard from './StatusItemCard';

interface RFIDStatusItem {
    rfid: string;
    timestamp: Date;
    status: 'found' | 'not_found' | 'checking';
    details?: string;
    garment?: any;
    message?: string;
}

interface StatusResultsListProps {
    filteredItems: RFIDStatusItem[];
    totalItems: number;
}

const StatusResultsList = memo(({ filteredItems, totalItems }: StatusResultsListProps) => {
    return (
        <div className="bg-white border-2 border-green-500 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
                    Status Results
                </h2>
                <span className="text-gray-600 font-mono text-sm">
                    {filteredItems.length} of {totalItems} items
                </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <CheckCircle2 className="w-20 h-20 mx-auto mb-4 opacity-30" />
                        <p className="text-xl font-medium">Belum ada data checking</p>
                        <p className="text-sm mt-2">Scan atau ketik RFID untuk memulai checking status</p>
                    </div>
                ) : (
                    filteredItems.map((item, index) => (
                        <StatusItemCard key={`${item.rfid}-${index}`} item={item} index={index} />
                    ))
                )}
            </div>
        </div>
    );
});

StatusResultsList.displayName = 'StatusResultsList';

export default StatusResultsList;

