import { memo, useMemo } from 'react';
import { AlertTriangle, Box } from 'lucide-react';
import RejectTableHeader from './RejectTableHeader';
import RejectTableRow from './RejectTableRow';
import type { RFIDItem } from '../../hooks/useListRFID';

type RejectItem = RFIDItem;

interface RejectTableProps {
 loading: boolean;
 error: string | null;
 rejectData: RejectItem[];
 onView: (item: RejectItem) => void;
 onDelete: (item: RejectItem) => void;
 onRefresh: () => void;
}

const RejectTable = memo(({
 loading,
 error,
 rejectData,
 onView,
 onDelete,
 onRefresh,
}: RejectTableProps) => {
 const scrollbarStyles = useMemo(
  () => `
            div[class*="overflow-y-auto"]::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            div[class*="overflow-y-auto"]::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
            }
            div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
            }
            div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }
        `,
  []
 );

 if (loading) {
  return (
   <div className="flex flex-col items-center justify-center h-full text-slate-400">
    <div className="w-12 h-12 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin mb-4"></div>
    <p className="text-base font-medium">Loading data RFID Reject...</p>
   </div>
  );
 }

 if (error) {
  return (
   <div className="flex flex-col items-center justify-center h-full text-red-500">
    <AlertTriangle size={48} className="mb-4 opacity-50" />
    <h3 className="text-lg font-bold">Error Loading Data Reject</h3>
    <p className="text-sm mb-4">{error}</p>
    <button
     onClick={onRefresh}
     className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
    >
     Retry
    </button>
   </div>
  );
 }

 if (rejectData.length === 0) {
  return (
   <div className="flex flex-col items-center justify-center h-full text-slate-400">
    <Box size={48} className="mb-4 opacity-30" />
    <h3 className="text-lg font-bold text-slate-600">Tidak ada data reject</h3>
    <p className="text-sm">
     Belum ada data RFID dengan status REJECT atau tidak ditemukan dengan filter yang dipilih.
    </p>
   </div>
  );
 }

 return (
  <div
   className="flex flex-col h-full overflow-x-auto"
   style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}
  >
   <style>{scrollbarStyles}</style>
   <div className="min-w-max flex flex-col h-full">
    <RejectTableHeader />
    <div
     className="flex-1 overflow-y-auto min-h-0"
     style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#cbd5e1 #f1f5f9',
      WebkitOverflowScrolling: 'touch',
     }}
    >
     {rejectData.map((item, index) => (
      <RejectTableRow
       key={item.id}
       item={item}
       index={index}
       onView={onView}
       onDelete={onDelete}
      />
     ))}
    </div>
   </div>
  </div>
 );
});

RejectTable.displayName = 'RejectTable';

export default RejectTable;

