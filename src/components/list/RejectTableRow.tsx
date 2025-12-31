import { memo } from 'react';
import { Eye, Trash2, MapPin } from 'lucide-react';
import type { RFIDItem } from '../../hooks/useListRFID';

type RejectItem = RFIDItem;

interface RejectTableRowProps {
 item: RejectItem;
 index: number;
 onView: (item: RejectItem) => void;
 onDelete: (item: RejectItem) => void;
}

const RejectTableRow = memo(({ item, index, onView, onDelete }: RejectTableRowProps) => {
 const lokasiUpper = item.lokasi?.toUpperCase().trim() || '';
 const isOutputSewing = lokasiUpper === 'OUTPUT_SEWING' || lokasiUpper.includes('OUTPUT_SEWING');

 return (
  <div
   className={`flex items-center px-3 py-3.5 border-b border-slate-100 transition-all duration-200 text-sm font-medium group gap-2 min-w-max ${index % 2 === 0
     ? 'bg-white hover:bg-red-50/60'
     : 'bg-slate-50/60 hover:bg-red-50/60'
    }`}
  >
   <div className="w-[130px] shrink-0 text-center">
    <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 font-mono shadow-sm group-hover:shadow-md transition-shadow">
     {item.rfid}
    </span>
   </div>
   <div className="w-[75px] shrink-0 text-center text-slate-700 font-semibold text-sm">
    {item.nomor_wo || '-'}
   </div>
   <div className="w-[85px] shrink-0 text-center text-slate-700 text-sm">
    {item.style || '-'}
   </div>
   <div className="w-[140px] shrink-0 text-center text-slate-700 text-sm">
    <span className="truncate block" title={item.buyer || '-'}>
     {item.buyer || '-'}
    </span>
   </div>
   <div className="w-[180px] shrink-0 text-center text-slate-700 text-sm">
    <span className="truncate block" title={item.item || '-'}>
     {item.item || '-'}
    </span>
   </div>
   <div className="w-[80px] shrink-0 text-center">
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold">
     <span
      className="w-3 h-3 rounded-full border-2 border-slate-300 shadow-sm"
      style={{
       backgroundColor: item.color?.toLowerCase() || '#ccc',
      }}
     ></span>
     <span className="text-slate-700 truncate">
      {item.color || '-'}
     </span>
    </span>
   </div>
   <div className="w-[55px] shrink-0 text-center font-bold text-slate-700 text-sm">
    {item.size || '-'}
   </div>
   <div className="w-[85px] shrink-0 text-center">
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold shadow-sm bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200">
     {(item.status || 'Unknown').toUpperCase()}
    </span>
   </div>
   <div className="w-[85px] shrink-0 text-center">
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold shadow-sm bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200">
     <MapPin size={11} />
     {isOutputSewing ? (
      <span className="truncate">OUTPUT</span>
     ) : (
      <span className="truncate">
       {item.lokasi || '-'}
      </span>
     )}
    </span>
   </div>
   <div className="w-[75px] shrink-0 text-center">
    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-red-50 text-red-700 font-bold text-xs border border-red-200 shadow-sm">
     {item.line || '-'}
    </span>
   </div>
   <div className="w-20 shrink-0 flex justify-center gap-1.5">
    <button
     onClick={() => onView(item)}
     className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
     title="View Details"
    >
     <Eye size={16} />
    </button>
    <button
     onClick={() => onDelete(item)}
     className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
     title="Delete Data"
    >
     <Trash2 size={16} />
    </button>
   </div>
  </div>
 );
});

RejectTableRow.displayName = 'RejectTableRow';

export default RejectTableRow;

