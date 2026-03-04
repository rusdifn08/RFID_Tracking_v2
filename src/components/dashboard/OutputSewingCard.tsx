import { memo } from 'react';
import outputIcon from '../../../assets/output.png';
import targetIcon from '../../assets/target.webp';
import { CheckCircle2 } from 'lucide-react';

interface OutputSewingCardProps {
  outputLine: number;
  targetOutput?: number;
  onClick?: () => void;
}

const OutputSewingCard = memo(({ outputLine, targetOutput, onClick }: OutputSewingCardProps) => {
  const targetMet = targetOutput !== undefined && targetOutput > 0 && (outputLine || 0) >= targetOutput;

  return (
    <div
      className="rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl flex flex-col shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-lg group border h-full bg-white border-blue-500 hover:border-blue-600"
      style={{
        padding: 'clamp(0.25rem, 0.6vw + 0.15rem, 0.75rem)',
      }}
    >
      <div
        className="relative flex flex-col items-center justify-center h-full w-full bg-transparent rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-2xl transition-all duration-300 ease-out transform hover:-translate-y-1 cursor-pointer"
        onClick={onClick}
      >
        <div
          className="flex flex-col items-center justify-center pb-1"
          style={{ gap: 'clamp(0.375rem, 0.6vw + 0.2rem, 0.75rem)' }}
        >
          <div className="flex items-center justify-center flex-shrink-0">
            <img
              src={outputIcon}
              alt="Output Sewing"
              style={{
                width: 'clamp(28px, 3.5vw + 12px, 80px)',
                height: 'clamp(28px, 3.5vw + 12px, 80px)',
              }}
              className="group-hover:scale-110 transition-transform duration-300 object-contain"
            />
          </div>
          <h3
            className="font-semibold tracking-tight transition-colors text-center text-gray-900"
            style={{
              textTransform: 'none',
              fontSize: 'clamp(0.5rem, 0.9vw + 0.25rem, 1.25rem)',
              fontWeight: 600,
            }}
          >
            Sewing Output
          </h3>
          <span
            className="font-bold leading-none tracking-tighter transition-all duration-500 ease-in-out transform scale-100 hover:scale-105 text-center text-blue-700"
            style={{
              fontSize: 'clamp(1.75rem, 4.5vw + 0.5rem, 5rem)',
              fontWeight: 700,
            }}
          >
            {outputLine || 0}
          </span>
          {targetOutput !== undefined && targetOutput > 0 && (
            <div
              className={`flex items-center justify-center gap-1 rounded-full px-2 py-0.5 border shrink-0 mb-0.5 transition-colors ${
                targetMet
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700'
                  : 'bg-slate-100/80 border-slate-300/80 text-slate-600'
              }`}
              style={{ fontSize: 'clamp(0.5625rem, 0.75vw + 0.15rem, 0.75rem)' }}
            >
              <img src={targetIcon} alt="" className="w-3 h-3 flex-shrink-0 object-contain" aria-hidden />
              {targetMet && <CheckCircle2 className="flex-shrink-0" size={12} strokeWidth={2.5} aria-hidden />}
              <span className="font-medium text-gray-600 tracking-tight">Target: {targetOutput}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

OutputSewingCard.displayName = 'OutputSewingCard';

export default OutputSewingCard;
