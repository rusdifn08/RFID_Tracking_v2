import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useSidebar } from '../context/SidebarContext';
import ExportModal from '../components/ExportModal';
import { exportToExcel } from '../utils/exportToExcel';
import { API_BASE_URL } from '../config/api';
import {
    Search,
    Filter,
    RefreshCw,
    Trash2,
    Eye,
    X,
    AlertTriangle,
    MapPin,
    Box,
    FileText,
    Activity
} from 'lucide-react';

interface RFIDItem {
    id: string | number;
    rfid: string;
    style?: string;
    buyer?: string;
    nomor_wo?: string;
    item?: string;
    color?: string;
    size?: string;
    status: string;
    lokasi?: string;
    line?: string;
}

// Interface untuk response dari API tracking/rfid_garment
interface TrackingRFIDGarmentResponse {
    count: number;
    data: Array<{
        bagian: string;
        buyer: string;
        color: string;
        id: number;
        id_garment: number;
        item: string;
        last_status: string;
        line: string;
        nama: string;
        rejectCount: number;
        reworkCount: number;
        rfid_garment: string;
        rfid_user: string;
        size: string;
        style: string;
        timestamp: string;
        wo: string;
    }>;
}

const ListRFID: React.FC = () => {
    const { isOpen } = useSidebar();
    const location = useLocation();
    const [rfidData, setRfidData] = useState<RFIDItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    
    // Deteksi line dari URL query parameter atau default ke line 1
    const getLineFromUrl = (): string => {
        // Cek query parameter ?line=1
        const urlParams = new URLSearchParams(location.search);
        const lineParam = urlParams.get('line');
        if (lineParam) {
            return lineParam;
        }
        
        // Cek path parameter /list-rfid/:line
        const lineMatch = location.pathname.match(/\/list-rfid\/?(\d+)?/);
        if (lineMatch && lineMatch[1]) {
            return lineMatch[1];
        }
        
        // Default ke line 1 untuk /list-rfid
        return '1';
    };
    
    const currentLine = getLineFromUrl();

    // Filters
    const [filterWO, setFilterWO] = useState<string>('');
    const [filterBuyer, setFilterBuyer] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterLocation, setFilterLocation] = useState<string>('');

    const [selectedScan, setSelectedScan] = useState<RFIDItem | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<RFIDItem | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [showExportModal, setShowExportModal] = useState<boolean>(false);

    // Fungsi untuk handle export
    const handleExport = (format: 'excel' | 'csv') => {
        const now = new Date();
        const tanggal = now.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        // Filter data berdasarkan filter yang aktif
        const filteredData = rfidData.filter(item => {
            const matchSearch = !searchTerm || 
                item.rfid.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.style?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.buyer?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchWO = !filterWO || item.nomor_wo === filterWO;
            const matchBuyer = !filterBuyer || item.buyer === filterBuyer;
            const matchStatus = !filterStatus || item.status === filterStatus;
            const matchLocation = !filterLocation || item.lokasi === filterLocation;

            return matchSearch && matchWO && matchBuyer && matchStatus && matchLocation;
        });

        // Konversi data RFID ke format export
        const exportData = filteredData.map(item => {
            // Hitung balance (untuk sementara menggunakan nilai default)
            const outputSewing = 0; // Tidak ada data output di ListRFID
            const qcGood = item.status === 'Good' ? 1 : 0;
            const qcRework = item.status === 'Rework' ? 1 : 0;
            const qcReject = item.status === 'Reject' ? 1 : 0;
            const qcWira = 0; // Tidak ada data WIRA di ListRFID
            const pqcGood = 0;
            const pqcRework = 0;
            const pqcReject = 0;
            const pqcWira = 0;
            const goodSewing = 0;
            const balance = 0;

            return {
                tanggal: tanggal,
                line: item.line || 'LINE 1',
                wo: item.nomor_wo || '-',
                style: item.style || '-',
                item: item.item || '-',
                buyer: item.buyer || '-',
                outputSewing: outputSewing,
                qcRework: qcRework,
                qcWira: qcWira,
                qcReject: qcReject,
                qcGood: qcGood,
                pqcRework: pqcRework,
                pqcWira: pqcWira,
                pqcReject: pqcReject,
                pqcGood: pqcGood,
                goodSewing: goodSewing,
                balance: balance
            };
        });

        // Jika tidak ada data, buat satu row kosong
        if (exportData.length === 0) {
            exportData.push({
                tanggal: tanggal,
                line: 'LINE 1',
                wo: '-',
                style: '-',
                item: '-',
                buyer: '-',
                outputSewing: 0,
                qcRework: 0,
                qcWira: 0,
                qcReject: 0,
                qcGood: 0,
                pqcRework: 0,
                pqcWira: 0,
                pqcReject: 0,
                pqcGood: 0,
                goodSewing: 0,
                balance: 0
            });
        }

        const lineId = filteredData[0]?.line?.match(/\d+/)?.[0] || '1';
        exportToExcel(exportData, lineId, format);
    };

    // Fetch data dari API tracking/rfid_garment
    const fetchRFIDData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Panggil API: http://10.8.0.104:7000/tracking/rfid_garment
            // API ini akan dipanggil melalui proxy server (server.js)
            const apiUrl = `${API_BASE_URL}/tracking/rfid_garment`;
            console.log('🔍 [ListRFID] Fetching data from:', apiUrl);
            console.log('🔍 [ListRFID] Current line filter:', currentLine);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            console.log('📥 [ListRFID] Response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [ListRFID] HTTP Error:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const rawResult = await response.json();
            console.log('📦 [ListRFID] Raw API Response:', rawResult);
            
            // Handle berbagai format response
            let result: TrackingRFIDGarmentResponse;
            if (rawResult.data && Array.isArray(rawResult.data)) {
                // Format: { count, data: [...] }
                result = rawResult as TrackingRFIDGarmentResponse;
            } else if (Array.isArray(rawResult)) {
                // Format: [...] (langsung array)
                result = {
                    count: rawResult.length,
                    data: rawResult
                };
            } else {
                // Format lain, coba ambil data dari berbagai kemungkinan key
                result = {
                    count: rawResult.count || 0,
                    data: rawResult.data || rawResult.items || rawResult.results || []
                };
            }
            
            console.log('📦 [ListRFID] Parsed Response:', {
                count: result.count,
                dataLength: result.data?.length || 0,
                firstItem: result.data?.[0]
            });
            
            // Pastikan result.data adalah array
            if (!result.data || !Array.isArray(result.data)) {
                console.warn('⚠️ [ListRFID] Data is not an array:', result);
                setRfidData([]);
                setLoading(false);
                return;
            }
            
            // Mapping data dari API ke format RFIDItem
            const mappedData: RFIDItem[] = result.data.map((item) => {
                // Convert last_status ke format yang sesuai (Good, Rework, Reject)
                let status = 'Unknown';
                if (item.last_status) {
                    const upperStatus = item.last_status.toUpperCase();
                    if (upperStatus === 'GOOD') {
                        status = 'Good';
                    } else if (upperStatus === 'REWORK') {
                        status = 'Rework';
                    } else if (upperStatus === 'REJECT') {
                        status = 'Reject';
                    } else {
                        status = item.last_status;
                    }
                }
                
                const itemLine = item.line?.toString() || '1';
                
                return {
                    id: item.id,
                    rfid: item.rfid_garment,
                    style: item.style,
                    buyer: item.buyer,
                    nomor_wo: item.wo,
                    item: item.item,
                    color: item.color,
                    size: item.size,
                    status: status,
                    lokasi: item.bagian || '', // bagian -> lokasi
                    line: `Line ${itemLine}`,
                };
            });
            
            console.log('🔄 [ListRFID] Mapped data count:', mappedData.length);
            
            // Filter berdasarkan line jika currentLine ada
            // Untuk sementara, tampilkan semua data tanpa filter line
            // Karena semua data dari API sudah memiliki line yang sesuai
            let filteredByLine = mappedData;
            
            if (currentLine && currentLine !== 'all') {
                filteredByLine = mappedData.filter(item => {
                    // Extract line number dari format "Line 1" atau langsung dari item.line
                    let itemLineNumber = '1';
                    if (item.line) {
                        const lineMatch = item.line.toString().match(/\d+/);
                        if (lineMatch) {
                            itemLineNumber = lineMatch[0];
                        }
                    }
                    const matches = itemLineNumber === currentLine;
                    if (!matches && mappedData.length < 20) {
                        // Hanya log jika data sedikit untuk debugging
                        console.log(`🔍 [ListRFID] Filtered out: line ${itemLineNumber} !== ${currentLine}`, item);
                    }
                    return matches;
                });
            }
            
            console.log('✅ [ListRFID] Final filtered data count:', filteredByLine.length);
            console.log('✅ [ListRFID] Sample data:', filteredByLine.slice(0, 3));
            
            setRfidData(filteredByLine);
            setLoading(false);
        } catch (error) {
            console.error('❌ [ListRFID] Error fetching RFID data:', error);
            setError(error instanceof Error ? error.message : 'Gagal memuat data RFID');
            setRfidData([]);
            setLoading(false);
        }
    };

    // Load data saat component mount dan saat line berubah
    useEffect(() => {
        fetchRFIDData();
    }, [currentLine]);

    // Filter data
    const filteredData = rfidData.filter(item => {
        const matchSearch = (item.rfid?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.nomor_wo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.style?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchWO = !filterWO || item.nomor_wo === filterWO;
        const matchBuyer = !filterBuyer || item.buyer === filterBuyer;
        const matchStatus = !filterStatus || item.status === filterStatus;
        const matchLocation = !filterLocation || item.lokasi === filterLocation;

        return matchSearch && matchWO && matchBuyer && matchStatus && matchLocation;
    });

    // Get unique values for filters
    const uniqueWOs = [...new Set(rfidData.map(item => item.nomor_wo).filter(Boolean))].sort();
    const uniqueBuyers = [...new Set(rfidData.map(item => item.buyer).filter(Boolean))].sort();
    const uniqueStatuses = [...new Set(rfidData.map(item => item.status).filter(Boolean))].sort();
    const uniqueLocations = [...new Set(rfidData.map(item => item.lokasi).filter(Boolean))].sort();

    // Handle view details
    const handleView = (item: RFIDItem) => {
        setSelectedScan(item);
        setShowModal(true);
    };

    // Handle close modal
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedScan(null);
    };

    // Handle refresh data
    const handleRefresh = () => {
        fetchRFIDData();
    };

    // Handle delete data - show modal
    const handleDelete = (item: RFIDItem) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    // Confirm delete data
    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        // Simulasi delete untuk mock data
        setTimeout(() => {
            setRfidData(prev => prev.filter(item => item.id !== itemToDelete.id));
            showNotification(`✅ Data RFID "${itemToDelete.rfid}" berhasil dihapus!`);
            setShowDeleteModal(false);
            setItemToDelete(null);
            setIsDeleting(false);
        }, 500);
    };

    // Cancel delete
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
        setIsDeleting(false);
    };

    // Show notification
    const showNotification = (message: string) => {
        const notification = document.createElement('div');
        notification.className = 'fixed top-5 right-5 bg-gradient-to-br from-emerald-500 to-green-600 text-white px-5 py-3 rounded-lg shadow-lg z-[1000] transform transition-transform duration-300 translate-x-full font-semibold text-sm';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    };

    // Sidebar width logic matching Header.tsx
    // Header uses: isOpen ? '15%' : '5rem'
    const sidebarWidth = isOpen ? '15%' : '5rem';

    return (
        <div className="flex min-h-screen w-full bg-[#f4f6f8] font-sans text-gray-800 overflow-hidden">
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full z-50 shadow-xl">
                <Sidebar />
            </div>

            {/* Main Content Wrapper */}
            <div
                className="flex flex-col w-full min-h-screen transition-all duration-300 ease-in-out"
                style={{
                    marginLeft: sidebarWidth,
                    width: `calc(100% - ${sidebarWidth})`
                }}
            >
                {/* Header - Fixed Position handled in Header component */}
                <Header onExportClick={() => setShowExportModal(true)} />

                {/* Page Content */}
                <main
                    className="flex-1 overflow-hidden flex flex-col min-h-0"
                    style={{
                        marginTop: '80px', // Jarak dari atas agar tidak tertutup header
                        padding: '20px',   // Padding konten
                        height: 'calc(100vh - 80px)', // Sesuaikan tinggi agar tidak double scroll
                        maxHeight: 'calc(100vh - 80px)'
                    }}
                >
                    {/* Page Header */}
                    <div
                        className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 shrink-0"
                        style={{ marginBottom: '20px' }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30 text-white">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">List Data RFID</h1>
                                <p className="text-slate-500 text-sm">Daftar lengkap semua RFID ID dari database</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                                <span className="text-slate-500 text-sm font-semibold">Total ID:</span>
                                <span className="text-blue-600 text-xl font-bold">{rfidData.length}</span>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all text-slate-600 hover:text-blue-600"
                                title="Refresh Data"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 shrink-0"
                        style={{ marginBottom: '20px', padding: '20px' }}
                    >
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by RFID ID, Work Order, or Style..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0">
                                {/* All WO Filter */}
                                <div className="relative min-w-[140px]">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <select
                                        value={filterWO}
                                        onChange={(e) => setFilterWO(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">All WO</option>
                                        {uniqueWOs.map((wo: any) => (
                                            <option key={wo} value={wo}>{wo}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* All Buyers Filter */}
                                <div className="relative min-w-[140px]">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <select
                                        value={filterBuyer}
                                        onChange={(e) => setFilterBuyer(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">All Buyers</option>
                                        {uniqueBuyers.map((buyer: any) => (
                                            <option key={buyer} value={buyer}>{buyer}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* All Status Filter */}
                                <div className="relative min-w-[140px]">
                                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">All Status</option>
                                        {uniqueStatuses.map((status: any) => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* All Locations Filter */}
                                <div className="relative min-w-[140px]">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <select
                                        value={filterLocation}
                                        onChange={(e) => setFilterLocation(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        <option value="">All Locations</option>
                                        {uniqueLocations.map((location: any) => (
                                            <option key={location} value={location}>{location}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div
                        className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden flex flex-col flex-1 min-h-0"
                    >
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-base font-medium">Loading RFID data...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-red-500">
                                <AlertTriangle size={48} className="mb-4 opacity-50" />
                                <h3 className="text-lg font-bold">Error Loading Data</h3>
                                <p className="text-sm mb-4">{error}</p>
                                <button
                                    onClick={handleRefresh}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Box size={48} className="mb-4 opacity-30" />
                                <h3 className="text-lg font-bold text-slate-600">Tidak ada data</h3>
                                <p className="text-sm">Belum ada data RFID atau tidak ditemukan dengan filter yang dipilih</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                                {/* Wrapper untuk header dan body dengan scroll horizontal bersama */}
                                <div className="min-w-max flex flex-col h-full">
                                    {/* Table Header - Sticky dengan gradient yang menarik */}
                                    <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-b-2 border-slate-600 shrink-0 sticky top-0 z-10 shadow-md">
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

                                    {/* Table Body - Scrollable dengan custom scrollbar */}
                                    <div 
                                        className="flex-1 overflow-y-auto min-h-0"
                                        style={{
                                            scrollbarWidth: 'thin',
                                            scrollbarColor: '#cbd5e1 #f1f5f9',
                                            WebkitOverflowScrolling: 'touch' // Smooth scrolling untuk mobile/tablet
                                        }}
                                    >
                                    <style>{`
                                        div[class*="overflow-y-auto"]::-webkit-scrollbar {
                                            width: 8px;
                                            height: 8px;
                                        }
                                        div[class*="overflow-y-auto"]::-webkit-scrollbar-track {
                                            background: #f1f5f9;
                                            border-radius: 4px;
                                        }
                                        div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb {
                                            background: #cbd5e1;
                                            border-radius: 4px;
                                        }
                                        div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb:hover {
                                            background: #94a3b8;
                                        }
                                    `}</style>
                                    {filteredData.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className={`flex items-center px-3 py-3.5 border-b border-slate-100 transition-all duration-200 text-sm font-medium group gap-2 min-w-max ${
                                                index % 2 === 0 
                                                    ? 'bg-white hover:bg-blue-50/50' 
                                                    : 'bg-slate-50/50 hover:bg-blue-50/50'
                                            }`}
                                        >
                                            <div className="w-[130px] shrink-0 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 font-mono shadow-sm group-hover:shadow-md transition-shadow">
                                                    {item.rfid}
                                                </span>
                                            </div>
                                            <div className="w-[75px] shrink-0 text-center text-slate-700 font-semibold text-sm">
                                                {item.nomor_wo || '-'}
                                            </div>
                                            <div className="w-[85px] shrink-0 text-center text-slate-700 text-sm">
                                                {item.style || '-'}
                                            </div>
                                            <div className="w-[140px] shrink-0 text-center text-slate-700 text-sm">
                                                <span className="truncate block" title={item.buyer || '-'}>
                                                    {item.buyer || '-'}
                                                </span>
                                            </div>
                                            <div className="w-[180px] shrink-0 text-center text-slate-700 text-sm">
                                                <span className="truncate block" title={item.item || '-'}>
                                                    {item.item || '-'}
                                                </span>
                                            </div>
                                            <div className="w-[80px] shrink-0 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold">
                                                    <span className="w-3 h-3 rounded-full border-2 border-slate-300 shadow-sm" style={{ backgroundColor: item.color?.toLowerCase() || '#ccc' }}></span>
                                                    <span className="text-slate-700 truncate">{item.color || '-'}</span>
                                                </span>
                                            </div>
                                            <div className="w-[55px] shrink-0 text-center font-bold text-slate-700 text-sm">
                                                {item.size || '-'}
                                            </div>
                                            <div className="w-[85px] shrink-0 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold shadow-sm transition-all ${
                                                    item.status === 'Good' 
                                                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                                                        : item.status === 'Reject' 
                                                        ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                                                        : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200'
                                                }`}>
                                                    {item.status || 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="w-[85px] shrink-0 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold shadow-sm ${
                                                    item.lokasi === 'Dryroom' 
                                                        ? 'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-200'
                                                        : 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200'
                                                }`}>
                                                    <MapPin size={11} />
                                                    <span className="truncate">{item.lokasi || '-'}</span>
                                                </span>
                                            </div>
                                            <div className="w-[75px] shrink-0 text-center">
                                                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 shadow-sm">
                                                    {item.line || '-'}
                                                </span>
                                            </div>
                                            <div className="w-20 shrink-0 flex justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleView(item)}
                                                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                    title="Delete Data"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Detail Modal */}
            {showModal && selectedScan && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <FileText size={20} />
                                Detail RFID Data
                            </h2>
                            <button onClick={handleCloseModal} className="text-white/80 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">RFID ID</span>
                                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-sm">{selectedScan.rfid}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Nomor WO</span>
                                <span className="text-slate-800 font-medium text-sm">{selectedScan.nomor_wo}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Style</span>
                                <span className="text-slate-800 font-medium text-sm">{selectedScan.style}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Buyer</span>
                                <span className="text-slate-800 font-medium text-sm">{selectedScan.buyer}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Item</span>
                                <span className="text-slate-800 font-medium text-sm">{selectedScan.item}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Color</span>
                                <span className="text-slate-800 font-medium text-sm flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: selectedScan.color?.toLowerCase() }}></span>
                                    {selectedScan.color}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Size</span>
                                <span className="text-slate-800 font-medium text-sm">{selectedScan.size}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Status</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedScan.status === 'Good' ? 'bg-green-100 text-green-700' :
                                        selectedScan.status === 'Reject' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {selectedScan.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Lokasi</span>
                                <span className="flex items-center gap-1 text-slate-800 font-medium text-sm">
                                    <MapPin size={14} className="text-slate-400" />
                                    {selectedScan.lokasi || '-'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-slate-500 font-medium text-sm">Line</span>
                                <span className="text-slate-800 font-medium text-sm">{selectedScan.line}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 flex justify-end">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && itemToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={cancelDelete}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Hapus Data RFID?</h2>
                            <p className="text-slate-500 mb-6">
                                Apakah Anda yakin ingin menghapus data RFID <span className="font-mono font-bold text-slate-700">{itemToDelete.rfid}</span>?
                                Tindakan ini tidak dapat dibatalkan.
                            </p>

                            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-6 text-left flex gap-3">
                                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                                <p className="text-xs text-red-700">
                                    Data yang dihapus akan hilang permanen dari database dan tidak dapat dipulihkan kembali.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Menghapus...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            Hapus
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
                lineId="1"
            />
        </div>
    );
};

export default ListRFID;
