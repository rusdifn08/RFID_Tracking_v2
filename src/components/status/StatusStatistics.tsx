import { memo } from 'react';
import { BarChart3, CheckCircle2, XCircle } from 'lucide-react';

interface StatusStatisticsProps {
    total: number;
    found: number;
    notFound: number;
}

const StatusStatistics = memo(({ total, found, notFound }: StatusStatisticsProps) => {
    return (
        <div className="flex-1 lg:flex-none lg:w-1/3 xl:w-2/5">
            <div className="grid grid-cols-3 gap-2 xs:gap-2.5 sm:gap-3 h-full">
                {/* Total Checks */}
                <div className="bg-green-50 border border-green-300 rounded-lg p-2 xs:p-2.5 sm:p-3 flex flex-col items-center justify-center">
                    <BarChart3 className="w-4 xs:w-5 sm:w-6 h-4 xs:h-5 sm:h-6 text-green-500 mb-1 xs:mb-1.5" />
                    <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-600 font-medium mb-0.5 xs:mb-1 text-center">
                        Total
                    </p>
                    <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-green-600 leading-none">
                        {total}
                    </p>
                </div>

                {/* Found */}
                <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-2 xs:p-2.5 sm:p-3 flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-4 xs:w-5 sm:w-6 h-4 xs:h-5 sm:h-6 text-emerald-500 mb-1 xs:mb-1.5" />
                    <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-600 font-medium mb-0.5 xs:mb-1 text-center">
                        Found
                    </p>
                    <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 leading-none">
                        {found}
                    </p>
                </div>

                {/* Not Found */}
                <div className="bg-red-50 border border-red-300 rounded-lg p-2 xs:p-2.5 sm:p-3 flex flex-col items-center justify-center">
                    <XCircle className="w-4 xs:w-5 sm:w-6 h-4 xs:h-5 sm:h-6 text-red-500 mb-1 xs:mb-1.5" />
                    <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-600 font-medium mb-0.5 xs:mb-1 text-center">
                        Not Found
                    </p>
                    <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-red-600 leading-none">
                        {notFound}
                    </p>
                </div>
            </div>
        </div>
    );
});

StatusStatistics.displayName = 'StatusStatistics';

export default StatusStatistics;

