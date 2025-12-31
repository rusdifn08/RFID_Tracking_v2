import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SvgIconComponent } from '@mui/icons-material';

interface LineDetailCardProps {
 id: number;
 title: string;
 subtitle: string;
 icon: SvgIconComponent;
 path: string;
 isHovered: boolean;
 isOtherHovered: boolean;
 onMouseEnter: () => void;
 onMouseLeave: () => void;
}

const LineDetailCard = memo(({
 title,
 subtitle,
 icon: Icon,
 path,
 isHovered,
 isOtherHovered,
 onMouseEnter,
 onMouseLeave,
}: LineDetailCardProps) => {
 const navigate = useNavigate();

 // Jika card lain sedang di-hover, card ini menjadi abu-abu
 const isGrayedOut = isOtherHovered && !isHovered;

 return (
  <div
   className={`bg-white rounded-2xl shadow-md border border-gray-200 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
    isGrayedOut ? 'opacity-50' : ''
   }`}
   onMouseEnter={onMouseEnter}
   onMouseLeave={onMouseLeave}
   onClick={() => navigate(path)}
   style={{
    padding: '1.5rem',
    aspectRatio: '2 / 1', // Height = 1/2 dari width
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
   }}
  >
   {/* Icon Container - di atas, kiri */}
   <div className={`p-3 rounded-lg transition-colors duration-300 flex-shrink-0 mb-3 ${
    isGrayedOut ? 'bg-gray-100' : 'bg-blue-50'
   }`}>
    <Icon
     sx={{
      fontSize: '2.5rem',
      color: isGrayedOut ? '#9ca3af' : '#3b82f6',
      transition: 'color 0.3s',
     }}
    />
   </div>

   {/* Title and Subtitle - di bawah icon, kiri */}
   <div className="flex flex-col items-start space-y-1 w-full">
    <h3 className={`text-xl font-bold transition-colors duration-300 ${
     isGrayedOut ? 'text-gray-400' : 'text-blue-600'
    }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
     {title}
    </h3>
    <p className={`text-base transition-colors duration-300 ${
     isGrayedOut ? 'text-gray-400' : 'text-blue-500'
    }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
     {subtitle}
    </p>
   </div>
  </div>
 );
});

LineDetailCard.displayName = 'LineDetailCard';

export default LineDetailCard;

