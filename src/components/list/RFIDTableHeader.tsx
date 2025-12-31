import { memo } from 'react';

const RFIDTableHeader = memo(() => {
    return (
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 border-b-2 border-blue-800 shrink-0 sticky top-0 z-10 shadow-md">
            <div className="flex items-center px-3 h-14 text-xs font-extrabold text-white uppercase tracking-wider gap-2">
                <div className="w-[130px] shrink-0 text-center font-semibold">RFID ID</div>
                <div className="w-[75px] shrink-0 text-center font-semibold">WO</div>
                <div className="w-[85px] shrink-0 text-center font-semibold">Style</div>
                <div className="w-[140px] shrink-0 text-center font-semibold">Buyer</div>
                <div className="w-[180px] shrink-0 text-center font-semibold">Item</div>
                <div className="w-[80px] shrink-0 text-center font-semibold">Color</div>
                <div className="w-[55px] shrink-0 text-center font-semibold">Size</div>
                <div className="w-[85px] shrink-0 text-center font-semibold">Status</div>
                <div className="w-[85px] shrink-0 text-center font-semibold">Lokasi</div>
                <div className="w-[75px] shrink-0 text-center font-semibold">Line</div>
                <div className="w-20 shrink-0 text-center font-semibold">Actions</div>
            </div>
        </div>
    );
});

RFIDTableHeader.displayName = 'RFIDTableHeader';

export default RFIDTableHeader;

