import { memo } from 'react';
import { Person } from '@mui/icons-material';

interface LineDetailHeaderProps {
 supervisor: string;
}

const LineDetailHeader = memo(({ supervisor }: LineDetailHeaderProps) => {
 return (
  <div className="flex flex-col items-center justify-center text-center mt-4 mb-6">
   {/* Supervisor Pill */}
   {supervisor && supervisor !== '-' && (
    <div className="inline-flex items-center gap-3 px-5 py-3 bg-white rounded-full shadow-lg border-2 border-gray-300 mb-6">
     <Person className="w-5 h-5 text-gray-700" sx={{ fontSize: '1.25rem' }} />
     <span className="text-base font-bold text-gray-800 uppercase tracking-wide" style={{ fontFamily: 'Poppins, sans-serif' }}>
      Supervisor {supervisor}
     </span>
    </div>
   )}
  </div>
 );
});

LineDetailHeader.displayName = 'LineDetailHeader';

export default LineDetailHeader;

