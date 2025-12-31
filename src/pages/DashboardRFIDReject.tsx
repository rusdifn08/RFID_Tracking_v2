import { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSidebar } from '../context/SidebarContext';
import backgroundImage from '../assets/background.jpg';
import ChartCard from '../components/dashboard/ChartCard';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Activity, BarChart3, Table, Filter, Download, Calendar, TrendingUp } from 'lucide-react';
import ExportModal from '../components/ExportModal';
import { exportToExcel, type ExportType } from '../utils/exportToExcel';

interface LineRejectData {
    line: string;
    wo: string;
    checkIn: number;
    checkOut: number;
    mati: number;
    waiting: number;
}

export default function DashboardRFIDReject() {
    const { isOpen } = useSidebar();

    // --- STATE UNTUK FILTER & EXPORT (DATA REJECT PER LINE) ---
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');
    const [showFilterModal, setShowFilterModal] = useState(false);

    const [filterWo, setFilterWo] = useState<string>('');
    const [showWoFilterModal, setShowWoFilterModal] = useState(false);

    const [showExportModal, setShowExportModal] = useState(false);

    // Mock data dashboard Reject Room
    // Aturan:
    // - Reject Check In >= Reject Check Out >= Reject Mati
    // - Waiting Reject = Check In - Check Out
    const rejectCheckIn = 180;
    const rejectCheckOut = 150;
    const rejectMati = 40;
    const waitingReject = rejectCheckIn - rejectCheckOut; // 30

    const totalReject = rejectCheckIn + rejectCheckOut + rejectMati;

    const pieStatusData = [
        { name: 'Check In', value: rejectCheckIn, color: '#0ea5e9' },
        { name: 'Check Out', value: rejectCheckOut, color: '#22c55e' },
        { name: 'Reject Mati', value: rejectMati, color: '#ef4444' },
        { name: 'Waiting Reject', value: waitingReject, color: '#f97316' },
    ];

    const lineRejectData = [
        { line: 'LINE 1', wo: 'WO-001', checkIn: 35, checkOut: 30, mati: 8, waiting: 5 },
        { line: 'LINE 2', wo: 'WO-002', checkIn: 28, checkOut: 24, mati: 6, waiting: 4 },
        { line: 'LINE 3', wo: 'WO-003', checkIn: 25, checkOut: 21, mati: 5, waiting: 4 },
        { line: 'LINE 4', wo: 'WO-004', checkIn: 22, checkOut: 19, mati: 5, waiting: 3 },
        { line: 'LINE 5', wo: 'WO-005', checkIn: 19, checkOut: 16, mati: 4, waiting: 3 },
        { line: 'LINE 6', wo: 'WO-006', checkIn: 18, checkOut: 15, mati: 4, waiting: 3 },
        { line: 'LINE 7', wo: 'WO-007', checkIn: 17, checkOut: 14, mati: 4, waiting: 3 },
        { line: 'LINE 8', wo: 'WO-008', checkIn: 16, checkOut: 13, mati: 3, waiting: 3 },
        { line: 'LINE 9', wo: 'WO-009', checkIn: 20, checkOut: 18, mati: 5, waiting: 2 },
    ];

    const filteredLineRejectData = useMemo(() => {
        if (!filterWo) return lineRejectData;
        return lineRejectData.filter((row) => row.wo === filterWo);
    }, [filterWo]);

    // Data untuk grafik Right first time Month (Jan-Dec)
    const rightFirstTimeData = useMemo(() => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        // Data sesuai gambar: mulai 97.0%, turun ke 90.65% di May, naik lagi
        const percentages = [97.0, 97.4, 96.98, 90.65, 96.55, 96.69,
            96.34, 97.19, 96.80, 96.82, 96.89, 96.85];
        return months.map((month, idx) => ({
            month: month.substring(0, 3), // Jan, Feb, Mar, etc
            monthFull: month,
            percentage: percentages[idx]
        }));
    }, []);

    // Data untuk grafik Data reject per jam (8 jam: 08:00 - 15:00) untuk LINE 1, LINE 2, LINE 3
    const rejectPerHourLineData = useMemo(() => {
        const hours = Array.from({ length: 8 }, (_, i) => i + 8); // 8 sampai 15 (08:00 - 15:00)
        const selectedLines = lineRejectData.slice(0, 3); // Hanya LINE 1, LINE 2, LINE 3

        // Fungsi untuk generate nilai konsisten berdasarkan seed
        const seededRandom = (seed: number) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        return hours.map((hour) => {
            const data: { hour: string;[key: string]: string | number } = { hour: `${hour.toString().padStart(2, '0')}:00` };
            selectedLines.forEach((line, lineIdx) => {
                // Generate nilai konsisten berdasarkan hour dan lineIdx
                const seed = hour * 100 + lineIdx;
                const randomValue = seededRandom(seed);
                // Generate reject per jam (0-15) dengan pola yang konsisten
                const rejectCount = Math.floor(randomValue * 16);
                data[line.line] = rejectCount;
            });
            return data;
        });
    }, [lineRejectData]);

    // Data untuk tabel Detail Data Reject Garment
    const detailRejectGarmentData = useMemo(() => {
        return filteredLineRejectData.map((row, idx) => ({
            no: idx + 1,
            line: row.line,
            wo: row.wo,
            style: `STYLE-${idx + 1}`,
            qty: row.checkIn + row.checkOut + row.mati
        }));
    }, [filteredLineRejectData]);

    const sidebarWidth = isOpen ? '18%' : '5rem';

    return (
        <div
            className="flex h-screen w-full font-sans text-gray-800 overflow-hidden fixed inset-0 m-0 p-0"
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
                    width: isOpen ? 'calc(100% - 18%)' : 'calc(100% - 5rem)',
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
                    <div className="flex flex-col gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 h-full">
                        {/* ROW 1: Overview Data Reject (2/8) + 2 Grafik (6/8, dibagi 2) */}
                        <div className="flex gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 h-[40%] min-h-0">
                            {/* OVERVIEW DATA REJECT - 2/8 width */}
                            <ChartCard
                                title="Overview Data Reject"
                                icon={BarChart3}
                                className="w-2/8 min-h-0"
                                iconColor="#dc2626"
                                iconBgColor="#fee2e2"
                            >
                                <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-2.5 p-1 xs:p-1.5 sm:p-2 h-full min-h-0">
                                    {/* Pie Chart */}
                                    <div className="flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="35%"
                                                    outerRadius="85%"
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {pieStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* Total Reject */}
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[10px] xs:text-xs sm:text-sm font-semibold text-slate-600 mb-1">
                                            TOTAL REJECT
                                        </span>
                                        <span className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-red-600">
                                            {totalReject.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </ChartCard>

                            {/* CONTAINER 2 GRAFIK - 6/8 width, dibagi 2 */}
                            <div className="w-6/8 flex gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 h-full min-h-0">
                                {/* RIGHT FIRST TIME MONTH - 1/2 dari 6/8 */}
                                <ChartCard
                                    title="Right first time Month"
                                    icon={TrendingUp}
                                    className="w-1/2 min-h-0"
                                    iconColor="#22c55e"
                                    iconBgColor="#dcfce7"
                                >
                                    <div className="h-full min-h-0 p-1 xs:p-1.5 sm:p-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={rightFirstTimeData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fontSize: 10 }}
                                                    interval={0}
                                                />
                                                <YAxis
                                                    domain={[90, 98]}
                                                    tick={{ fontSize: 10 }}
                                                    label={{ value: 'Right first time (%)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        fontSize: '12px'
                                                    }}
                                                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Right first time']}
                                                    labelFormatter={(label) => {
                                                        const monthData = rightFirstTimeData.find(d => d.month === label);
                                                        return monthData?.monthFull || label;
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="percentage"
                                                    stroke="#22c55e"
                                                    strokeWidth={2}
                                                    dot={{ r: 4, fill: '#22c55e' }}
                                                    name="Right first time"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ChartCard>

                                {/* DATA REJECT PER JAM - 1/2 dari 6/8 */}
                                <ChartCard
                                    title="Data Reject per Jam"
                                    icon={TrendingUp}
                                    className="w-1/2 min-h-0"
                                    iconColor="#8b5cf6"
                                    iconBgColor="#f3e8ff"
                                >
                                    <div className="h-full min-h-0 p-1 xs:p-1.5 sm:p-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={rejectPerHourLineData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis
                                                    dataKey="hour"
                                                    tick={{ fontSize: 10 }}
                                                    interval={0}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 10 }}
                                                    label={{ value: 'Jumlah Reject', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        fontSize: '12px'
                                                    }}
                                                />
                                                <Legend
                                                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                                                    iconType="line"
                                                />
                                                {lineRejectData.slice(0, 3).map((line, idx) => {
                                                    const colors = ['#0ea5e9', '#22c55e', '#ef4444']; // Blue, Green, Red untuk LINE 1, 2, 3
                                                    return (
                                                        <Line
                                                            key={line.line}
                                                            type="monotone"
                                                            dataKey={line.line}
                                                            stroke={colors[idx]}
                                                            strokeWidth={2}
                                                            dot={{ r: 3 }}
                                                            name={line.line}
                                                        />
                                                    );
                                                })}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ChartCard>
                            </div>
                        </div>

                        {/* ROW 2: Left Column (Distribusi Status) + Right Column (Detail Data Reject Garment Table) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 flex-1 min-h-0">
                            {/* LEFT COLUMN - Hanya Distribusi Status Reject */}
                            <div className="flex flex-col gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 h-full min-h-0">
                                {/* DISTRIBUSI STATUS REJECT */}
                                <ChartCard
                                    title="Distribusi Status Reject"
                                    icon={Activity}
                                    className="flex-1 min-h-0"
                                    iconColor="#0369a1"
                                    iconBgColor="#e0f2fe"
                                >
                                    <div className="grid grid-cols-2 gap-1 xs:gap-1.5 sm:gap-2 p-1 xs:p-1.5 sm:p-2 h-full min-h-0">
                                        <StatusBox label="Waiting" value={waitingReject} color="#f97316" />
                                        <StatusBox label="Check In" value={rejectCheckIn} color="#0ea5e9" />
                                        <StatusBox label="Check Out" value={rejectCheckOut} color="#22c55e" />
                                        <StatusBox label="Reject Mati" value={rejectMati} color="#ef4444" />
                                    </div>
                                </ChartCard>
                            </div>

                            {/* RIGHT COLUMN - Detail Data Reject Garment Table */}
                            <div className="flex flex-col gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 h-full min-h-0">
                                {/* DETAIL DATA REJECT GARMENT */}
                                <ChartCard
                                    title="Detail Data Reject Garment"
                                    icon={Table}
                                    className="flex-1 min-h-0"
                                    iconColor="#0ea5e9"
                                    iconBgColor="#e0f2fe"
                                    headerAction={(
                                        <div className="flex items-center gap-1.5 xs:gap-2">
                                            <button
                                                onClick={() => setShowFilterModal(true)}
                                                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 xs:px-3 py-1.5 rounded-lg text-[10px] xs:text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                            >
                                                <Filter className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Filter</span>
                                            </button>
                                            <button
                                                onClick={() => setShowExportModal(true)}
                                                className="inline-flex items-center gap-1.5 px-2.5 xs:px-3 py-1.5 rounded-lg text-[10px] xs:text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md transition-colors"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Export</span>
                                            </button>
                                        </div>
                                    )}
                                >
                                    <div className="p-1.5 xs:p-2 sm:p-2.5 overflow-auto h-full min-h-0">
                                        <table className="w-full border-collapse text-[10px] xs:text-[11px] sm:text-xs">
                                            <thead>
                                                <tr>
                                                    <HeaderCell>NO</HeaderCell>
                                                    <HeaderCell>Line</HeaderCell>
                                                    <HeaderCell>WO</HeaderCell>
                                                    <HeaderCell>STYLE</HeaderCell>
                                                    <HeaderCell>QTY</HeaderCell>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailRejectGarmentData.map((row, idx: number) => (
                                                    <tr
                                                        key={idx}
                                                        className={`transition-colors duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                                                            } hover:bg-sky-50/70`}
                                                    >
                                                        <BodyCell className="text-center">{row.no}</BodyCell>
                                                        <BodyCell className="font-semibold text-slate-700">{row.line}</BodyCell>
                                                        <BodyCell>{row.wo}</BodyCell>
                                                        <BodyCell>{row.style}</BodyCell>
                                                        <BodyCell className="font-semibold text-red-600">{row.qty.toLocaleString()}</BodyCell>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </ChartCard>
                            </div>
                        </div>
                    </div>
                </main>

                {/* FILTER DATE MODAL */}
                {showFilterModal && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowFilterModal(false)}>
                        <div
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-blue-50">
                                        <Filter className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-800">Filter Data Tanggal</h3>
                                        <p className="text-[11px] text-slate-500">Filter data reject room berdasarkan rentang tanggal</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFilterModal(false)}
                                    className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="px-4 py-3 space-y-3">
                                <div>
                                    <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                                        Dari Tanggal
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={filterDateFrom}
                                            onChange={(e) => setFilterDateFrom(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                                        />
                                        <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                                        Sampai Tanggal
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={filterDateTo}
                                            onChange={(e) => setFilterDateTo(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                                        />
                                        <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                                <button
                                    onClick={() => {
                                        setFilterDateFrom('');
                                        setFilterDateTo('');
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setShowFilterModal(false)}
                                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                                >
                                    Terapkan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FILTER WO MODAL */}
                {showWoFilterModal && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowWoFilterModal(false)}>
                        <div
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-purple-50">
                                        <Filter className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-800">Filter WO</h3>
                                        <p className="text-[11px] text-slate-500">Tampilkan data reject berdasarkan WO dummy</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowWoFilterModal(false)}
                                    className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="px-4 py-4 space-y-3">
                                <div>
                                    <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                                        Work Order (WO)
                                    </label>
                                    <select
                                        value={filterWo}
                                        onChange={(e) => setFilterWo(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-purple-500"
                                    >
                                        <option value="">Semua WO</option>
                                        {lineRejectData.map((row) => (
                                            <option key={row.wo} value={row.wo}>
                                                {row.wo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                                <button
                                    onClick={() => setFilterWo('')}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setShowWoFilterModal(false)}
                                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-sm"
                                >
                                    Terapkan
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Export Modal */}
                <ExportModal
                    isOpen={showExportModal}
                    onClose={() => setShowExportModal(false)}
                    onExport={async (format: 'excel' | 'csv', exportType: ExportType) => {
                        const tanggal = filterDateFrom || new Date().toISOString().split('T')[0];

                        const exportData = filteredLineRejectData.map((row: LineRejectData) => ({
                            tanggal,
                            line: row.line,
                            wo: row.wo || '-',
                            style: '-',
                            item: '-',
                            buyer: '-',
                            color: undefined,
                            size: undefined,
                            outputSewing: row.checkIn + row.checkOut,
                            qcRework: 0,
                            qcWira: 0,
                            qcReject: row.mati,
                            qcGood: row.checkOut,
                            pqcRework: 0,
                            pqcWira: 0,
                            pqcReject: 0,
                            pqcGood: row.checkOut,
                            goodSewing: row.checkOut,
                            balance: 0,
                        }));

                        await exportToExcel(exportData, 'REJECT', format, filterDateFrom, filterDateTo, exportType);
                    }}
                    lineId="REJECT"
                />

                <Footer />
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

interface CellProps {
    children: React.ReactNode;
    className?: string;
}

function HeaderCell({ children }: CellProps) {
    return (
        <th
            className="border px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 sm:py-2 text-left font-bold"
            style={{
                background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                color: '#0f172a',
                borderColor: '#0284C7',
                borderWidth: '1px',
            }}
        >
            {children}
        </th>
    );
}

function BodyCell({ children, className }: CellProps) {
    return (
        <td
            className={`border px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 sm:py-2 text-[10px] xs:text-[11px] sm:text-xs text-gray-700 ${className || ''}`}
            style={{
                borderColor: '#e5e7eb',
                borderWidth: '1px',
            }}
        >
            {children}
        </td>
    );
}


interface StatusBoxProps {
    label: string;
    value: number;
    color: string;
}

function StatusBox({ label, value, color }: StatusBoxProps) {
    return (
        <div
            className="flex flex-col items-center justify-center rounded-lg border-2 p-1 xs:p-1.5 sm:p-2 h-full min-h-0 bg-white/90 shadow-sm hover:shadow-md transition-all"
            style={{ borderColor: color }}
        >
            <span
                className="text-xs xs:text-sm sm:text-base md:text-lg font-bold mb-1"
                style={{ color }}
            >
                {label}
            </span>
            <span
                className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black"
                style={{ color }}
            >
                {value.toLocaleString()}
            </span>
        </div>
    );
}


