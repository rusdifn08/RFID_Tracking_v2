import { memo } from 'react';
import excelIcon from '../../../assets/excel.png';

interface ExportButtonProps {
  onClick: () => void;
  className?: string;
}

export const ExportButton = memo(({ onClick, className = '' }: ExportButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center
        rounded-lg
        bg-emerald-100 hover:bg-emerald-200
        text-emerald-800
        border border-emerald-200 hover:border-emerald-300
        transition-all duration-200 ease-out
        shadow-sm hover:shadow
        active:scale-95
        py-1 px-2
        min-w-[2rem] min-h-[2rem]
        ${className}
      `}
      title="Export"
      aria-label="Export"
    >
      <img 
        src={excelIcon} 
        alt="Export Excel" 
        className="w-4 h-4 object-contain flex-shrink-0"
      />
    </button>
  );
});

ExportButton.displayName = 'ExportButton';
