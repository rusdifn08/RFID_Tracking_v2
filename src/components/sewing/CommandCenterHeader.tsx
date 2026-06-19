import React, { memo, useMemo } from 'react';
import { Search, FileSpreadsheet } from 'lucide-react';
import { cn, FLUID } from './sewingBatchTw';
import { OrderMetaField, OverviewLineCard } from './OverviewStatCard';

export type CommandCenterOrder = {
  wo: string;
  style: string;
  size: string;
  buyer: string;
  item: string;
  color: string;
};

type CommandCenterHeaderProps = {
  line: string;
  order: CommandCenterOrder;
  filterDateFrom: string;
  filterDateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onSearchClick: () => void;
  onResetClick: () => void;
  onExportExcelClick: () => void;
};

const parseLineNo = (line: string): string => {
  const match = line.match(/\d+/);
  return match?.[0] ?? line;
};

const ORDER_ROW_TOP: { key: keyof CommandCenterOrder; label: string }[] = [
  { key: 'wo', label: 'WO' },
  { key: 'style', label: 'Style' },
  { key: 'size', label: 'Size' },
  { key: 'color', label: 'Color' },
];

const ORDER_ROW_BOTTOM: { key: keyof CommandCenterOrder; label: string }[] = [
  { key: 'buyer', label: 'Buyer' },
  { key: 'item', label: 'Item' },
];

const CommandCenterHeader: React.FC<CommandCenterHeaderProps> = memo(({
  line,
  order,
  filterDateFrom,
  filterDateTo,
  onDateFromChange,
  onDateToChange,
  onSearchClick,
  onResetClick,
  onExportExcelClick,
}) => {
  const lineNo = useMemo(() => parseLineNo(line), [line]);

  return (
    <header className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
      <div className={cn(FLUID.metaShellPad, 'grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,3.8fr)_minmax(0,1.8fr)]', FLUID.metaGap)}>
        <OverviewLineCard lineNo={lineNo} />

        {/* Order Details Metadata */}
        <div className={cn('grid h-full min-h-0 grid-rows-2 items-stretch', FLUID.metaGap)}>
          <div className={cn('grid h-full min-h-0 grid-cols-4 items-stretch', FLUID.metaGap)}>
            {ORDER_ROW_TOP.map(({ key, label }) => (
              <OrderMetaField key={key} label={label} value={order[key]} />
            ))}
          </div>
          <div className={cn('grid h-full min-h-0 grid-cols-2 items-stretch', FLUID.metaGap)}>
            {ORDER_ROW_BOTTOM.map(({ key, label }) => (
              <OrderMetaField key={key} label={label} value={order[key]} />
            ))}
          </div>
        </div>

        {/* Date Filter inputs */}
        <div className="flex flex-col justify-between border-l border-slate-100 pl-[clamp(0.25rem,0.6vw,0.75rem)] min-h-0 gap-1 py-0.5">
          <div className="flex flex-col flex-1 justify-center gap-1">
            <div className="flex items-center gap-2">
              <span className="w-8 sm:w-10 text-[clamp(0.56rem,0.45vw+0.6vh,0.9rem)] font-bold text-slate-400 uppercase tracking-wide">From</span>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="flex-1 h-[clamp(1.5rem,1.3vw+1.3vh,2.4rem)] px-[clamp(0.35rem,0.4vw,0.6rem)] text-[clamp(0.68rem,0.55vw+0.7vh,1.1rem)] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 sm:w-10 text-[clamp(0.56rem,0.45vw+0.6vh,0.9rem)] font-bold text-slate-400 uppercase tracking-wide">To</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="flex-1 h-[clamp(1.5rem,1.3vw+1.3vh,2.4rem)] px-[clamp(0.35rem,0.4vw,0.6rem)] text-[clamp(0.68rem,0.55vw+0.7vh,1.1rem)] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Cari, Reset & Export Buttons */}
          <div className="grid grid-cols-3 gap-1.5 mt-auto w-full">
            <button
              onClick={onSearchClick}
              className="w-full h-[clamp(1.5rem,1.3vw+1.3vh,2.4rem)] text-[clamp(0.62rem,0.5vw+0.6vh,1.1rem)] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition flex items-center justify-center gap-1 shadow-sm"
            >
              <Search className="h-[clamp(0.6rem,0.5vw+0.5vh,0.9rem)] w-[clamp(0.6rem,0.5vw+0.5vh,0.9rem)] shrink-0" strokeWidth={2.5} />
              CARI
            </button>
            <button
              onClick={onResetClick}
              className="w-full h-[clamp(1.5rem,1.3vw+1.3vh,2.4rem)] text-[clamp(0.62rem,0.5vw+0.6vh,1.1rem)] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition flex items-center justify-center"
              title="Reset Filters"
            >
              RESET
            </button>
            <button
              onClick={onExportExcelClick}
              className="w-full h-[clamp(1.5rem,1.3vw+1.3vh,2.4rem)] text-[clamp(0.62rem,0.5vw+0.6vh,1.1rem)] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition flex items-center justify-center shadow-sm"
              title="Export to Excel"
            >
              <FileSpreadsheet className="h-[clamp(0.7rem,0.6vw+0.6vh,1.1rem)] w-[clamp(0.7rem,0.6vw+0.6vh,1.1rem)] shrink-0" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

CommandCenterHeader.displayName = 'CommandCenterHeader';

export default CommandCenterHeader;
