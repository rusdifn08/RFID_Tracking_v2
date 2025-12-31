import { memo, useMemo } from 'react';
import { AlertTriangle, Box } from 'lucide-react';
import RFIDTableHeader from './RFIDTableHeader';
import RFIDTableRow from './RFIDTableRow';

import type { RFIDItem } from '../../hooks/useListRFID';

interface RFIDTableProps {
 loading: boolean;
 error: string | null;
 filteredData: RFIDItem[];
 onView: (item: RFIDItem) => void;
 onDelete: (item: RFIDItem) => void;
 onRefresh: () => void;
}

const RFIDTable = memo(({
 loading,
 error,
 filteredData,
 onView,
 onDelete,
 onRefresh,
}: RFIDTableProps) => {
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
    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
    <p className="text-base font-medium">Loading RFID data...</p>
   </div>
  );
 }

 if (error) {
  return (
   <div className="flex flex-col items-center justify-center h-full text-red-500">
    <AlertTriangle size={48} className="mb-4 opacity-50" />
    <h3 className="text-lg font-bold">Error Loading Data</h3>
    <p className="text-sm mb-4">{error}</p>
    <button
     onClick={onRefresh}
     className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
    >
     Retry
    </button>
   </div>
  );
 }

 if (filteredData.length === 0) {
  return (
   <div className="flex flex-col items-center justify-center h-full text-slate-400">
    <Box size={48} className="mb-4 opacity-30" />
    <h3 className="text-lg font-bold text-slate-600">Tidak ada data</h3>
    <p className="text-sm">Belum ada data RFID atau tidak ditemukan dengan filter yang dipilih</p>
   </div>
  );
 }

 return (
  <div className="flex flex-col h-full overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
   <style>{scrollbarStyles}</style>
   <div className="min-w-max flex flex-col h-full">
    <RFIDTableHeader />
    <div
     className="flex-1 overflow-y-auto min-h-0"
     style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#cbd5e1 #f1f5f9',
      WebkitOverflowScrolling: 'touch',
     }}
    >
     {filteredData.map((item, index) => (
      <RFIDTableRow
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

RFIDTable.displayName = 'RFIDTable';

export default RFIDTable;

