import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useSidebar } from '../context/SidebarContext';
import backgroundImage from '../assets/background.jpg';
import ChartCard from '../components/dashboard/ChartCard';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BarChart3, Droplet, Layers, Table, XCircle } from 'lucide-react';

export default function DashboardRFIDFinishing() {
    const { isOpen } = useSidebar();
    
    // Mock Data dengan aturan:
    // 1. Data sekitar 1000an
    // 2. Dryroom Check Out = Folding Check In (saling berkorelasi)
    // 3. Check In >= Check Out untuk semua area
    // 4. Reject Room lebih sedikit dari Dryroom dan Folding

    // Dryroom: Check In >= Check Out
    const dryroomCheckIn = 1200;
    const dryroomCheckOut = 1150; // Akan menjadi Folding Check In
    
    // Folding: Check In = Dryroom Check Out (korelasi), Check In >= Check Out
    const foldingCheckIn = dryroomCheckOut; // 1150 (sama dengan Dryroom Check Out)
    const foldingCheckOut = 1100; // Data yang sudah siap dikirim
    
    // Reject Room: Check In >= Check Out >= Reject Mati, lebih sedikit dari area lain
    const rejectCheckIn = 85;
    const rejectCheckOut = 75; // rejectCheckOut <= rejectCheckIn
    const rejectMati = 45; // rejectMati <= rejectCheckOut

    // Total per area
    const totalDryroom = dryroomCheckIn + dryroomCheckOut; // 2350
    const totalFolding = foldingCheckIn + foldingCheckOut; // 2250
    const totalReject = rejectCheckIn + rejectCheckOut + rejectMati; // 205

    // Total Finishing = Total dari semua area
    const totalFinishing = totalDryroom + totalFolding + totalReject; // 4805

    // Data untuk pie chart - pembagian Dryroom, Folding, Reject Room
    const pieData = [
        { name: 'Dryroom', value: totalDryroom, color: '#06b6d4' },
        { name: 'Folding', value: totalFolding, color: '#14b8a6' },
        { name: 'Reject Room', value: totalReject, color: '#f59e0b' }
    ];

    // Mock Data untuk tabel - 9 baris dengan line 1-9, qty berbeda, total = totalFinishing (4805)
    const finishingData = [
        { wo: 'WO-001', line: '1', style: 'STYLE-A', qty: 535 },
        { wo: 'WO-002', line: '2', style: 'STYLE-B', qty: 540 },
        { wo: 'WO-003', line: '3', style: 'STYLE-C', qty: 530 },
        { wo: 'WO-004', line: '4', style: 'STYLE-A', qty: 545 },
        { wo: 'WO-005', line: '5', style: 'STYLE-B', qty: 535 },
        { wo: 'WO-006', line: '6', style: 'STYLE-C', qty: 540 },
        { wo: 'WO-007', line: '7', style: 'STYLE-A', qty: 530 },
        { wo: 'WO-008', line: '8', style: 'STYLE-B', qty: 535 },
        { wo: 'WO-009', line: '9', style: 'STYLE-C', qty: 515 }
    ];

    // Verifikasi total qty = totalFinishing (535+540+530+545+535+540+530+535+515 = 4805)
    const totalQty = finishingData.reduce((sum, item) => sum + item.qty, 0);

    const sidebarWidth = isOpen ? '18%' : '5rem';

    return (
        <div className="flex h-screen w-full font-sans text-gray-800 overflow-hidden fixed inset-0 m-0 p-0"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            }}
        >
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full z-50 shadow-xl">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div
                className="flex flex-col w-full h-screen transition-all duration-300 ease-in-out"
                style={{
                    marginLeft: sidebarWidth,
                    width: isOpen ? 'calc(100% - 18%)' : 'calc(100% - 5rem)'
                }}
            >
                {/* Header */}
                <div className="sticky top-0 z-40 shadow-md">
                    <Header />
                </div>

                {/* Main Content */}
                <main
                    className="flex-1 w-full overflow-hidden px-1.5 xs:px-2 sm:px-3 md:px-4 relative"
                    style={{
                        marginTop: 'clamp(4.5rem, 10vh, 5.5rem)',
                        paddingTop: 'clamp(0.5rem, 1vh, 1rem)',
                        paddingBottom: '0.5rem',
                        minHeight: 0,
                    }}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 h-full">
                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-1 flex flex-col gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 h-full min-h-0">
                            {/* OVERVIEW DATA FINISHING */}
                            <ChartCard
                                title="Overview Data Finishing"
                                icon={BarChart3}
                                className="flex-[1] min-h-0"
                            >
                                <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-2.5 p-0.5 xs:p-0.5 sm:p-1 h-full min-h-0">
                                    {/* Grid 1: Pie Chart */}
                                    <div className="flex items-center justify-center min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="25%"
                                                    outerRadius="90%"
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* Grid 2: Total Finishing */}
                                    <div className="flex flex-col items-center justify-center min-h-0">
                                        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 mb-0.5 xs:mb-1">
                                            Total Finishing
                                        </span>
                                        <span 
                                            className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold leading-none"
                                            style={{ color: '#0284C7' }}
                                        >
                                            {totalFinishing.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </ChartCard>

                            {/* DRYROOM */}
                            <ChartCard
                                title="Dryroom"
                                icon={Droplet}
                                className="flex-[1] min-h-0"
                                iconColor="#16a34a"
                                iconBgColor="#dcfce7"
                            >
                                <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-2.5 p-1 xs:p-1.5 sm:p-2 h-full min-h-0 overflow-hidden">
                                    {/* Check In */}
                                    <div 
                                        className="rounded-lg xs:rounded-xl sm:rounded-2xl p-[2px] transition-all duration-300 hover:scale-105 group relative h-full min-h-0 flex"
                                        style={{
                                            background: 'linear-gradient(135deg, #7dd3fc 0%, #0284c7 50%, #fbbf24 100%)',
                                            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                    >
                                        <div className="rounded-lg xs:rounded-xl sm:rounded-2xl bg-white w-full h-full flex flex-col items-center justify-center p-0.5 xs:p-1 sm:p-1.5 min-h-0">
                                            <span className="text-[10px] xs:text-xs sm:text-sm md:text-base font-semibold mb-0.5 xs:mb-1 text-gray-700">
                                                Check In
                                            </span>
                                            <span className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-none text-gray-800">
                                                {dryroomCheckIn.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Check Out */}
                                    <div 
                                        className="rounded-lg xs:rounded-xl sm:rounded-2xl p-[2px] transition-all duration-300 hover:scale-105 group relative h-full min-h-0 flex"
                                        style={{
                                            background: 'linear-gradient(135deg, #7dd3fc 0%, #0284c7 50%, #fbbf24 100%)',
                                            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                    >
                                        <div className="rounded-lg xs:rounded-xl sm:rounded-2xl bg-white w-full h-full flex flex-col items-center justify-center p-0.5 xs:p-1 sm:p-1.5 min-h-0">
                                            <span className="text-[10px] xs:text-xs sm:text-sm md:text-base font-semibold mb-0.5 xs:mb-1 text-gray-700">
                                                Check Out
                                            </span>
                                            <span className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-none text-gray-800">
                                                {dryroomCheckOut.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </ChartCard>

                            {/* FOLDING */}
                            <ChartCard
                                title="Folding"
                                icon={Layers}
                                className="flex-[1] min-h-0"
                                iconColor="#92400e"
                                iconBgColor="#fef3c7"
                            >
                                <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-2.5 p-1 xs:p-1.5 sm:p-2 h-full min-h-0 overflow-hidden">
                                    {/* Check In */}
                                    <div 
                                        className="rounded-lg xs:rounded-xl sm:rounded-2xl p-[2px] transition-all duration-300 hover:scale-105 group relative h-full min-h-0 flex"
                                        style={{
                                            background: 'linear-gradient(135deg, #7dd3fc 0%, #0284c7 50%, #fbbf24 100%)',
                                            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                    >
                                        <div className="rounded-lg xs:rounded-xl sm:rounded-2xl bg-white w-full h-full flex flex-col items-center justify-center p-0.5 xs:p-1 sm:p-1.5 min-h-0">
                                            <span className="text-[10px] xs:text-xs sm:text-sm md:text-base font-semibold mb-0.5 xs:mb-1 text-gray-700">
                                                Check In
                                            </span>
                                            <span className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-none text-gray-800">
                                                {foldingCheckIn.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Check Out */}
                                    <div 
                                        className="rounded-lg xs:rounded-xl sm:rounded-2xl p-[2px] transition-all duration-300 hover:scale-105 group relative h-full min-h-0 flex"
                                        style={{
                                            background: 'linear-gradient(135deg, #7dd3fc 0%, #0284c7 50%, #fbbf24 100%)',
                                            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                    >
                                        <div className="rounded-lg xs:rounded-xl sm:rounded-2xl bg-white w-full h-full flex flex-col items-center justify-center p-0.5 xs:p-1 sm:p-1.5 min-h-0">
                                            <span className="text-[10px] xs:text-xs sm:text-sm md:text-base font-semibold mb-0.5 xs:mb-1 text-gray-700">
                                                Check Out
                                            </span>
                                            <span className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-none text-gray-800">
                                                {foldingCheckOut.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </ChartCard>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="lg:col-span-2 flex flex-col gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 h-full min-h-0">
                            {/* DATA FINISHING DETAIL - Table */}
                            <ChartCard
                                title="Data Finishing Detail"
                                icon={Table}
                                className="flex-[2] min-h-0"
                            >
                                <div className="p-1.5 xs:p-2 sm:p-2.5 overflow-auto h-full">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr>
                                                <th 
                                                    className="border px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 sm:py-2 text-left text-[9px] xs:text-[10px] sm:text-xs font-bold"
                                                    style={{ 
                                                        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                                                        color: '#0284C7', 
                                                        borderColor: '#0284C7',
                                                        borderWidth: '1px'
                                                    }}
                                                >
                                                    WO
                                                </th>
                                                <th 
                                                    className="border px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 sm:py-2 text-left text-[9px] xs:text-[10px] sm:text-xs font-bold"
                                                    style={{ 
                                                        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                                                        color: '#0284C7', 
                                                        borderColor: '#0284C7',
                                                        borderWidth: '1px'
                                                    }}
                                                >
                                                    Line
                                                </th>
                                                <th 
                                                    className="border px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 sm:py-2 text-left text-[9px] xs:text-[10px] sm:text-xs font-bold"
                                                    style={{ 
                                                        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                                                        color: '#0284C7', 
                                                        borderColor: '#0284C7',
                                                        borderWidth: '1px'
                                                    }}
                                                >
                                                    Style
                                                </th>
                                                <th 
                                                    className="border px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 sm:py-2 text-left text-[9px] xs:text-[10px] sm:text-xs font-bold"
                                                    style={{ 
                                                        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                                                        color: '#0284C7', 
                                                        borderColor: '#0284C7',
                                                        borderWidth: '1px'
                                                    }}
                                                >
                                                    Qty
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {finishingData.length > 0 ? (
                                                finishingData.map((item, index) => (
                                                    <tr 
                                                        key={index}
                                                        className="transition-colors duration-200 hover:bg-cyan-50/50"
                                                    >
                                                        <td className="border px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 sm:py-2 text-[9px] xs:text-[10px] sm:text-xs text-gray-700 font-medium" style={{ borderColor: '#bae6fd', borderWidth: '1px' }}>
                                                            {item.wo || '-'}
                                                        </td>
                                                        <td className="border px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 sm:py-2 text-[9px] xs:text-[10px] sm:text-xs text-gray-700 font-medium" style={{ borderColor: '#bae6fd', borderWidth: '1px' }}>
                                                            {item.line || '-'}
                                                        </td>
                                                        <td className="border px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 sm:py-2 text-[9px] xs:text-[10px] sm:text-xs text-gray-700 font-medium" style={{ borderColor: '#bae6fd', borderWidth: '1px' }}>
                                                            {item.style || '-'}
                                                        </td>
                                                        <td className="border px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 sm:py-2 text-[9px] xs:text-[10px] sm:text-xs text-gray-700 font-medium" style={{ borderColor: '#bae6fd', borderWidth: '1px' }}>
                                                            {item.qty ? item.qty.toLocaleString() : '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="border px-1.5 xs:px-2 sm:px-2.5 py-3 xs:py-4 text-center text-[9px] xs:text-[10px] sm:text-xs text-gray-400 italic" style={{ borderColor: '#bae6fd', borderWidth: '1px' }}>
                                                        No data available
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </ChartCard>

                            {/* REJECT ROOM */}
                            <ChartCard
                                title="Reject Room"
                                icon={XCircle}
                                className="flex-[1] min-h-0"
                                iconColor="#dc2626"
                                iconBgColor="#fee2e2"
                            >
                                <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-2.5 p-1 xs:p-1.5 sm:p-2 h-full min-h-0 overflow-hidden">
                                    {/* Check In */}
                                    <div 
                                        className="rounded-lg xs:rounded-xl sm:rounded-2xl p-[2px] transition-all duration-300 hover:scale-105 group relative h-full min-h-0 flex"
                                        style={{
                                            background: 'linear-gradient(135deg, #7dd3fc 0%, #0284c7 50%, #fbbf24 100%)',
                                            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                    >
                                        <div className="rounded-lg xs:rounded-xl sm:rounded-2xl bg-white w-full h-full flex flex-col items-center justify-center p-0.5 xs:p-1 sm:p-1.5 min-h-0">
                                            <span className="text-[10px] xs:text-xs sm:text-sm md:text-base font-semibold mb-0.5 xs:mb-1 text-center text-gray-700">
                                                Check In
                                            </span>
                                            <span className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-none text-gray-800">
                                                {rejectCheckIn.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Check Out */}
                                    <div 
                                        className="rounded-lg xs:rounded-xl sm:rounded-2xl p-[2px] transition-all duration-300 hover:scale-105 group relative h-full min-h-0 flex"
                                        style={{
                                            background: 'linear-gradient(135deg, #7dd3fc 0%, #0284c7 50%, #fbbf24 100%)',
                                            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                    >
                                        <div className="rounded-lg xs:rounded-xl sm:rounded-2xl bg-white w-full h-full flex flex-col items-center justify-center p-0.5 xs:p-1 sm:p-1.5 min-h-0">
                                            <span className="text-[10px] xs:text-xs sm:text-sm md:text-base font-semibold mb-0.5 xs:mb-1 text-center text-gray-700">
                                                Check Out
                                            </span>
                                            <span className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-none text-gray-800">
                                                {rejectCheckOut.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Reject Mati */}
                                    <div 
                                        className="rounded-lg xs:rounded-xl sm:rounded-2xl p-[2px] transition-all duration-300 hover:scale-105 group relative h-full min-h-0 flex"
                                        style={{
                                            background: 'linear-gradient(135deg, #7dd3fc 0%, #0284c7 50%, #fbbf24 100%)',
                                            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                    >
                                        <div className="rounded-lg xs:rounded-xl sm:rounded-2xl bg-white w-full h-full flex flex-col items-center justify-center p-0.5 xs:p-1 sm:p-1.5 min-h-0">
                                            <span className="text-[10px] xs:text-xs sm:text-sm md:text-base font-semibold mb-0.5 xs:mb-1 text-center text-gray-700">
                                                Reject Mati
                                            </span>
                                            <span className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-none text-gray-800">
                                                {rejectMati.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer 
                    className="absolute bottom-0 left-0 right-0 py-4 border-t border-gray-200/50 pointer-events-none"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(2px)',
                        zIndex: -1
                    }}
                >
                    <div className="text-center text-gray-600 text-sm pointer-events-auto" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400 }}>
                        Gistex Garmen Indonesia Monitoring System (GMS) © 2025 Served by Supernova
                    </div>
                </footer>
            </div>

            <style>{`
                /* Custom Scrollbar */
                main::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                main::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                main::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                main::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}

