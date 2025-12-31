import { memo } from 'react';
import { Search, Activity } from 'lucide-react';

interface StatusInputSectionProps {
    rfidInput: string;
    onRfidInputChange: (value: string) => void;
    isChecking: boolean;
    onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onCheck: (rfid: string) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
}

const StatusInputSection = memo(({
    rfidInput,
    onRfidInputChange,
    isChecking,
    onKeyPress,
    onCheck,
    inputRef,
}: StatusInputSectionProps) => {
    return (
        <div className="bg-white border-2 border-green-500 rounded-lg p-3 xs:p-4 sm:p-5 md:p-6 hover:shadow-lg hover:border-green-600 transition-all duration-300">
            <label className="block text-gray-700 font-bold text-[10px] xs:text-xs sm:text-sm mb-3 xs:mb-3.5 sm:mb-4 tracking-wide uppercase">
                Scan atau Ketik RFID Garment
            </label>
            
            <div className="flex flex-col lg:flex-row gap-3 xs:gap-4 sm:gap-5">
                <div className="flex-1 lg:flex-none lg:w-2/3 xl:w-3/5">
                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-2 xs:left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 xs:w-4.5 sm:w-5 h-4 xs:h-4.5 sm:h-5 text-green-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={rfidInput}
                                onChange={(e) => onRfidInputChange(e.target.value)}
                                onKeyPress={onKeyPress}
                                placeholder="Scan atau ketik RFID untuk checking status..."
                                disabled={isChecking}
                                className="w-full pl-8 xs:pl-10 sm:pl-12 pr-3 xs:pr-4 py-2 xs:py-2.5 sm:py-3 bg-white border-2 border-green-500 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-mono text-sm xs:text-base hover:bg-green-50"
                            />
                        </div>
                        <button
                            onClick={() => onCheck(rfidInput)}
                            disabled={(isChecking || !rfidInput.trim())}
                            className="px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 xs:gap-2 justify-center text-sm xs:text-base whitespace-nowrap"
                        >
                            {isChecking ? (
                                <>
                                    <Activity className="w-4 xs:w-4.5 sm:w-5 h-4 xs:h-4.5 sm:h-5 animate-spin" />
                                    <span className="hidden xs:inline">Checking...</span>
                                    <span className="xs:hidden">...</span>
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 xs:w-4.5 sm:w-5 h-4 xs:h-4.5 sm:h-5" />
                                    <span className="hidden xs:inline">Check Status</span>
                                    <span className="xs:hidden">Check</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

StatusInputSection.displayName = 'StatusInputSection';

export default StatusInputSection;

