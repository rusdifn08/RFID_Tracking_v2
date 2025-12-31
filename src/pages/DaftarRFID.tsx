import { useCallback, useEffect, useState, useRef, memo, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Breadcrumb from '../components/Breadcrumb';
import { useSidebar } from '../context/SidebarContext';
import ScanningRFIDNew from '../components/ScanningRFIDNew';
import backgroundImage from '../assets/background.jpg';
import { useDaftarRFID } from '../hooks/useDaftarRFID';
import RegistrationForm from '../components/daftar/RegistrationForm';
import DateFilterModal from '../components/daftar/DateFilterModal';
import RegisteredRFIDModal from '../components/daftar/RegisteredRFIDModal';
import ScanRejectModal from '../components/daftar/ScanRejectModal';
import UpdateDataModal from '../components/daftar/UpdateDataModal';
import { API_BASE_URL, getWOBreakdown } from '../config/api';

const DaftarRFID = memo(() => {
    const { isOpen } = useSidebar();

    // State untuk Update Modal
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateFormData, setUpdateFormData] = useState({
        rfid_garment: '',
        wo: '',
        style: '',
        buyer: '',
        item: '',
        color: '',
        size: ''
    });
    const [rfidInputValue, setRfidInputValue] = useState(''); // Input yang sedang diketik
    const [submittedRfid, setSubmittedRfid] = useState(''); // RFID yang sudah di-submit (Enter)
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isLoadingGarmentData, setIsLoadingGarmentData] = useState(false);
    const updateRfidInputRef = useRef<HTMLInputElement>(null);

    // Custom hook untuk semua state dan logic
    const {
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        showDateFilterModal,
        setShowDateFilterModal,
        showRegisteredModal,
        setShowRegisteredModal,
        showScanRejectModal,
        setShowScanRejectModal,
        rejectRfidInput,
        setRejectRfidInput,
        rejectScannedItems,
        isProcessingReject,
        rejectInputRef,
        loadingRegistered,
        filterStatus,
        setFilterStatus,
        searchTerm,
        setSearchTerm,
        filterColor,
        setFilterColor,
        filterSize,
        setFilterSize,
        workOrderData,
        loading,
        formData,
        focusedInput,
        setFocusedInput,
        hoveredCard,
        setHoveredCard,
        isModalOpen,
        setIsModalOpen,
        fetchProductionBranchData,
        handleRejectRfidSubmit,
        handleInputChange,
        handleSubmit,
        handleSubmitWithData,
        getItemStatus,
        registeredRFIDData,
        uniqueColors,
        uniqueSizes,
    } = useDaftarRFID();

    const getTodayDate = useCallback(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    // Query untuk fetch data garment berdasarkan RFID - hanya saat Enter ditekan
    const garmentQuery = useQuery({
        queryKey: ['garment-data', submittedRfid],
        queryFn: async () => {
            if (!submittedRfid.trim()) {
                return null;
            }

            const response = await fetch(`${API_BASE_URL}/tracking/check?rfid_garment=${encodeURIComponent(submittedRfid.trim())}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Gagal memuat data garment (${response.status})`);
            }

            return await response.json();
        },
        enabled: !!submittedRfid.trim() && showUpdateModal,
        retry: 1,
        staleTime: 30000,
    });

    // Query untuk fetch WO breakdown - selalu fetch saat modal dibuka
    const woBreakdownQuery = useQuery({
        queryKey: ['wo-breakdown-update'],
        queryFn: async () => {
            const getTodayDate = () => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const startDateFrom = getTodayDate();
            const response = await getWOBreakdown('CJL', startDateFrom);

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Gagal mengambil data WO breakdown');
            }

            return response.data;
        },
        enabled: showUpdateModal, // Fetch saat modal dibuka
        retry: 1,
        staleTime: 30000,
    });

    // Helper functions untuk mendapatkan opsi dropdown - dioptimasi dengan useMemo
    const getAllWOs = useMemo(() => {
        if (!woBreakdownQuery.data?.data || !Array.isArray(woBreakdownQuery.data.data)) {
            return [];
        }
        const allWOs = [...new Set(woBreakdownQuery.data.data.map((item: any) => String(item.wo_no || '').trim()).filter(Boolean))];
        return allWOs.sort();
    }, [woBreakdownQuery.data?.data]);

    const getFilteredData = useMemo(() => {
        if (!woBreakdownQuery.data?.data || !Array.isArray(woBreakdownQuery.data.data)) {
            return [];
        }
        let filtered = woBreakdownQuery.data.data;

        // Filter berdasarkan WO jika dipilih
        if (updateFormData.wo?.trim()) {
            const targetWO = updateFormData.wo.trim();
            filtered = filtered.filter((item: any) => {
                const itemWO = String(item.wo_no || '').trim();
                return itemWO === targetWO || itemWO.toUpperCase() === targetWO.toUpperCase();
            });
        }

        // Filter berdasarkan Style jika dipilih
        if (updateFormData.style?.trim()) {
            filtered = filtered.filter((item: any) => {
                const itemStyle = String(item.style || '').trim();
                return itemStyle === updateFormData.style.trim() || itemStyle.toUpperCase() === updateFormData.style.trim().toUpperCase();
            });
        }

        // Filter berdasarkan Buyer jika dipilih
        if (updateFormData.buyer?.trim()) {
            filtered = filtered.filter((item: any) => {
                const itemBuyer = String(item.buyer || '').trim();
                return itemBuyer === updateFormData.buyer.trim() || itemBuyer.toUpperCase() === updateFormData.buyer.trim().toUpperCase();
            });
        }

        // Filter berdasarkan Item jika dipilih
        if (updateFormData.item?.trim()) {
            filtered = filtered.filter((item: any) => {
                const itemProduct = String(item.product_name || '').trim();
                return itemProduct === updateFormData.item.trim() || itemProduct.toUpperCase() === updateFormData.item.trim().toUpperCase();
            });
        }

        // Filter berdasarkan Color jika dipilih
        if (updateFormData.color?.trim()) {
            filtered = filtered.filter((item: any) => {
                const itemColor = String(item.color || '').trim();
                return itemColor === updateFormData.color.trim() || itemColor.toUpperCase() === updateFormData.color.trim().toUpperCase();
            });
        }

        return filtered;
    }, [woBreakdownQuery.data?.data, updateFormData]);

    const getStyles = useMemo(() => {
        const filtered = getFilteredData;
        const styles = [...new Set(filtered.map((item: any) => String(item.style || '').trim()).filter(Boolean))];
        return styles.sort();
    }, [getFilteredData]);

    const getBuyers = useMemo(() => {
        const filtered = getFilteredData;
        const buyers = [...new Set(filtered.map((item: any) => String(item.buyer || '').trim()).filter(Boolean))];
        return buyers.sort();
    }, [getFilteredData]);

    const getItems = useMemo(() => {
        const filtered = getFilteredData;
        const items = [...new Set(filtered.map((item: any) => String(item.product_name || '').trim()).filter(Boolean))];
        return items.sort();
    }, [getFilteredData]);

    const getColors = useMemo(() => {
        // Untuk Color, hanya filter berdasarkan WO dan Style (jika ada), tidak perlu filter Item
        if (!woBreakdownQuery.data?.data || !Array.isArray(woBreakdownQuery.data.data)) {
            return [];
        }
        let filtered = woBreakdownQuery.data.data;

        // Filter berdasarkan WO jika dipilih
        if (updateFormData.wo?.trim()) {
            const targetWO = updateFormData.wo.trim();
            filtered = filtered.filter((item: any) => {
                const itemWO = String(item.wo_no || '').trim();
                return itemWO === targetWO || itemWO.toUpperCase() === targetWO.toUpperCase();
            });
        }

        // Filter berdasarkan Style jika dipilih (opsional, untuk lebih spesifik)
        if (updateFormData.style?.trim()) {
            filtered = filtered.filter((item: any) => {
                const itemStyle = String(item.style || '').trim();
                return itemStyle === updateFormData.style.trim() || itemStyle.toUpperCase() === updateFormData.style.trim().toUpperCase();
            });
        }

        // Jangan filter berdasarkan Buyer, Item, atau Color yang sudah dipilih
        // Karena Color bisa berbeda-beda untuk WO yang sama
        const colors = [...new Set(filtered.map((item: any) => String(item.color || '').trim()).filter(Boolean))];
        return colors.sort();
    }, [woBreakdownQuery.data?.data, updateFormData.wo, updateFormData.style]);

    const getSizes = useMemo(() => {
        // Untuk Size, filter berdasarkan WO, Style, Buyer, Item, dan Color (jika sudah dipilih)
        // Karena Size biasanya spesifik untuk kombinasi tertentu
        const filtered = getFilteredData;
        const sizes = [...new Set(filtered.map((item: any) => String(item.size || '').trim()).filter(Boolean))];
        return sizes.sort();
    }, [getFilteredData]);

    // Update form data saat garment query berhasil - set WO awal
    useEffect(() => {
        if (garmentQuery.data?.success && garmentQuery.data?.garment) {
            const garment = garmentQuery.data.garment;
            const wo = garment.wo || garment.wo_no || '';

            // Set WO terlebih dahulu
            setUpdateFormData(prev => ({
                ...prev,
                rfid_garment: prev.rfid_garment, // Keep RFID
                wo: wo,
                style: '', // Akan diisi dari dropdown
                buyer: '', // Akan diisi dari dropdown
                item: '', // Akan diisi dari dropdown
                color: '', // Akan diisi dari dropdown
                size: '' // Akan diisi dari dropdown
            }));
        } else if (garmentQuery.isError) {
            const errorMessage = garmentQuery.error?.message || 'Data garment tidak ditemukan';
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                setUpdateMessage({
                    type: 'error',
                    text: 'Tidak dapat terhubung ke server. Pastikan proxy server (server.js) berjalan.'
                });
            } else {
                setUpdateMessage({ type: 'error', text: errorMessage });
            }
        }
    }, [garmentQuery.data, garmentQuery.isError, garmentQuery.error]);

    // Auto-fill data pertama saat WO breakdown berhasil dimuat dan WO sudah ada
    useEffect(() => {
        if (woBreakdownQuery.data?.data && Array.isArray(woBreakdownQuery.data.data) && updateFormData.wo?.trim()) {
            const woBreakdownList = woBreakdownQuery.data.data;
            const targetWO = updateFormData.wo.trim();

            // Cari data yang sesuai dengan WO
            const woDataList = woBreakdownList.filter((item: any) => {
                const itemWO = String(item.wo_no || '').trim();
                return itemWO === targetWO || itemWO.toUpperCase() === targetWO.toUpperCase();
            });

            if (woDataList.length > 0) {
                // Ambil unique values
                const uniqueStyles = [...new Set(woDataList.map((item: any) => item.style).filter(Boolean))];
                const uniqueBuyers = [...new Set(woDataList.map((item: any) => item.buyer).filter(Boolean))];
                const uniqueItems = [...new Set(woDataList.map((item: any) => item.product_name).filter(Boolean))];
                const uniqueColors = [...new Set(woDataList.map((item: any) => item.color).filter(Boolean))];
                const uniqueSizes = [...new Set(woDataList.map((item: any) => item.size).filter(Boolean))];

                // Hanya set jika field masih kosong (untuk auto-fill pertama kali)
                setUpdateFormData(prev => ({
                    ...prev,
                    style: prev.style || (uniqueStyles.length > 0 ? uniqueStyles[0] : ''),
                    buyer: prev.buyer || (uniqueBuyers.length > 0 ? uniqueBuyers[0] : ''),
                    item: prev.item || (uniqueItems.length > 0 ? uniqueItems[0] : ''),
                    color: prev.color || (uniqueColors.length > 0 ? uniqueColors[0] : ''),
                    size: prev.size || (uniqueSizes.length > 0 ? uniqueSizes[0] : '')
                }));

                // Tidak set message untuk WO breakdown, biarkan message dari garment query saja
            }
        } else if (woBreakdownQuery.isError) {
            const errorMessage = woBreakdownQuery.error?.message || 'Gagal mengambil data WO breakdown';
            setUpdateMessage({
                type: 'error',
                text: `${errorMessage}. Silakan isi data manual.`
            });
        }
    }, [woBreakdownQuery.data, woBreakdownQuery.isError, woBreakdownQuery.error, updateFormData.wo]);

    // Handler untuk perubahan dropdown - reset field yang dependen
    // Handler functions - dioptimasi dengan useCallback
    const handleWOChange = useCallback((wo: string) => {
        setUpdateFormData(prev => ({
            ...prev,
            wo: wo,
            style: '', // Reset karena bergantung pada WO
            buyer: '', // Reset karena bergantung pada WO
            item: '', // Reset karena bergantung pada WO
            color: '', // Reset karena bergantung pada WO
            size: '' // Reset karena bergantung pada WO
        }));
    }, []);

    const handleStyleChange = useCallback((style: string) => {
        setUpdateFormData(prev => ({
            ...prev,
            style: style,
            buyer: '', // Reset karena bergantung pada Style
            item: '', // Reset karena bergantung pada Style
            color: '', // Reset karena bergantung pada Style
            size: '' // Reset karena bergantung pada Style
        }));
    }, []);

    const handleBuyerChange = useCallback((buyer: string) => {
        setUpdateFormData(prev => ({
            ...prev,
            buyer: buyer,
            item: '', // Reset karena bergantung pada Buyer
            color: '', // Reset karena bergantung pada Buyer
            size: '' // Reset karena bergantung pada Buyer
        }));
    }, []);

    const handleItemChange = useCallback((item: string) => {
        setUpdateFormData(prev => ({
            ...prev,
            item: item,
            color: '', // Reset karena bergantung pada Item
            size: '' // Reset karena bergantung pada Item
        }));
    }, []);

    const handleColorChange = useCallback((color: string) => {
        setUpdateFormData(prev => ({
            ...prev,
            color: color,
            size: '' // Reset karena bergantung pada Color
        }));
    }, []);

    // Update loading state
    useEffect(() => {
        setIsLoadingGarmentData(garmentQuery.isLoading || woBreakdownQuery.isLoading);
    }, [garmentQuery.isLoading, woBreakdownQuery.isLoading]);


    // Reset form ketika modal dibuka
    useEffect(() => {
        if (showUpdateModal) {
            setUpdateFormData({
                rfid_garment: '',
                wo: '',
                style: '',
                buyer: '',
                item: '',
                color: '',
                size: ''
            });
            setRfidInputValue('');
            setSubmittedRfid('');
            setUpdateMessage(null);
            setIsLoadingGarmentData(false);
            // Auto-focus pada input RFID setelah modal dibuka
            setTimeout(() => {
                updateRfidInputRef.current?.focus();
            }, 100);
        }
    }, [showUpdateModal]);

    // Handler untuk Enter pada input RFID - dioptimasi dengan useCallback
    const handleRfidKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmedRfid = rfidInputValue.trim();
            if (trimmedRfid) {
                setSubmittedRfid(trimmedRfid);
                setUpdateFormData(prev => ({
                    ...prev,
                    rfid_garment: trimmedRfid
                }));
            }
        }
    }, [rfidInputValue]);

    // Reset form jika submitted RFID kosong
    useEffect(() => {
        if (!showUpdateModal) return;

        if (!submittedRfid.trim()) {
            // Reset form jika submitted RFID kosong
            setUpdateFormData(prev => ({
                ...prev,
                wo: '',
                style: '',
                buyer: '',
                item: '',
                color: '',
                size: ''
            }));
            setUpdateMessage(null);
        }
    }, [submittedRfid, showUpdateModal]);

    // Mutation untuk update data garment
    const updateGarmentMutation = useMutation({
        mutationFn: async (formData: typeof updateFormData) => {
            if (!formData.rfid_garment.trim()) {
                throw new Error('RFID Garment wajib diisi');
            }

            // API endpoint langsung sesuai spesifikasi
            const API_UPDATE_URL = 'http://10.8.0.104:7000/garment/update';

            const response = await fetch(API_UPDATE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    rfid_garment: formData.rfid_garment.trim(),
                    wo: formData.wo.trim(),
                    style: formData.style.trim(),
                    buyer: formData.buyer.trim(),
                    item: formData.item.trim(),
                    color: formData.color.trim(),
                    size: formData.size.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Gagal memperbarui data garment');
            }

            return data;
        },
        onSuccess: (data) => {
            setUpdateMessage({ type: 'success', text: data.message || 'Data garment berhasil diperbarui' });
            // Reset form setelah 2 detik
            setTimeout(() => {
                setUpdateFormData({
                    rfid_garment: '',
                    wo: '',
                    style: '',
                    buyer: '',
                    item: '',
                    color: '',
                    size: ''
                });
                setUpdateMessage(null);
            }, 2000);
        },
        onError: (error: Error) => {
            setUpdateMessage({
                type: 'error',
                text: error.message || 'Terjadi kesalahan saat update data'
            });
        }
    });


    // Handler untuk submit update form
    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Jika user klik submit tapi belum tekan Enter, submit RFID yang sedang diketik
        if (rfidInputValue.trim() && !submittedRfid.trim()) {
            const trimmedRfid = rfidInputValue.trim();
            setSubmittedRfid(trimmedRfid);
            setUpdateFormData(prev => ({
                ...prev,
                rfid_garment: trimmedRfid
            }));
            setUpdateMessage({ type: 'success', text: 'Memuat data garment...' });
            return; // Query akan otomatis trigger, tunggu sampai selesai baru bisa submit
        }

        if (!updateFormData.rfid_garment.trim()) {
            setUpdateMessage({ type: 'error', text: 'RFID Garment wajib diisi. Tekan Enter setelah scan/ketik RFID.' });
            return;
        }

        // Pastikan semua field terisi
        if (!updateFormData.wo || !updateFormData.style || !updateFormData.buyer || !updateFormData.item || !updateFormData.color || !updateFormData.size) {
            setUpdateMessage({ type: 'error', text: 'Mohon lengkapi semua field sebelum update.' });
            return;
        }

        updateGarmentMutation.mutate(updateFormData);
    };

    // Sync isUpdating dengan mutation status
    useEffect(() => {
        setIsUpdating(updateGarmentMutation.isPending);
    }, [updateGarmentMutation.isPending]);

    // Fetch data saat component mount dan saat date berubah
    useEffect(() => {
        fetchProductionBranchData();
    }, [dateFrom, dateTo, fetchProductionBranchData]);

    return (
        <div className="flex min-h-screen w-full h-screen fixed inset-0 m-0 p-0"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            }}
        >


            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div
                className="flex flex-col w-full min-h-screen transition-all duration-300 ease-in-out"
                style={{ marginLeft: isOpen ? '18%' : '5rem', width: isOpen ? 'calc(100% - 18%)' : 'calc(100% - 5rem)' }}
            >
                {/* Header */}
                <Header />

                {/* Breadcrumb */}
                <Breadcrumb />

                {/* Content */}
                <main
                    className="flex-1 w-full flex items-center justify-center"
                    style={{
                        marginTop: '0',
                        height: 'calc(100vh - 4rem - 3rem)',
                        minHeight: 'calc(100vh - 4rem - 3rem)',
                        maxHeight: 'calc(100vh - 4rem)',
                        overflow: 'hidden'
                    }}
                >
                    <RegistrationForm
                        formData={formData}
                        workOrderData={workOrderData}
                        loading={loading}
                        focusedInput={focusedInput}
                        hoveredCard={hoveredCard}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onInputChange={handleInputChange}
                        onFocus={setFocusedInput}
                        onBlur={() => setFocusedInput(null)}
                        onMouseEnter={() => setHoveredCard(true)}
                        onMouseLeave={() => setHoveredCard(false)}
                        onDateFilterClick={() => setShowDateFilterModal(true)}
                        onRegisteredClick={() => setShowRegisteredModal(true)}
                        onRejectClick={() => setShowScanRejectModal(true)}
                        onUpdateClick={() => setShowUpdateModal(true)}
                        onSubmit={handleSubmit}
                        onSubmitWithData={handleSubmitWithData}
                    />
                </main>
            </div>

            {/* Date Filter Modal */}
            <DateFilterModal
                isOpen={showDateFilterModal}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onClose={() => setShowDateFilterModal(false)}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onReset={() => {
                    const today = getTodayDate();
                    setDateFrom(today);
                    setDateTo(today);
                }}
                onApply={() => setShowDateFilterModal(false)}
            />

            {/* Registered RFID Modal */}
            <RegisteredRFIDModal
                isOpen={showRegisteredModal}
                data={registeredRFIDData}
                loading={loadingRegistered}
                searchTerm={searchTerm}
                filterStatus={filterStatus}
                filterColor={filterColor}
                filterSize={filterSize}
                uniqueColors={uniqueColors}
                uniqueSizes={uniqueSizes}
                onClose={() => {
                    setShowRegisteredModal(false);
                    setSearchTerm('');
                    setFilterColor('Semua');
                    setFilterSize('Semua');
                }}
                onSearchChange={setSearchTerm}
                onFilterStatusChange={setFilterStatus}
                onFilterColorChange={setFilterColor}
                onFilterSizeChange={setFilterSize}
                getItemStatus={getItemStatus}
            />

            {/* Scan Reject Modal */}
            <ScanRejectModal
                isOpen={showScanRejectModal}
                rejectRfidInput={rejectRfidInput}
                rejectScannedItems={rejectScannedItems}
                isProcessingReject={isProcessingReject}
                rejectInputRef={rejectInputRef}
                onClose={() => setShowScanRejectModal(false)}
                onRfidInputChange={setRejectRfidInput}
                onRfidKeyDown={async (e) => {
                    if (e.key === 'Enter' && rejectRfidInput.trim() && !isProcessingReject) {
                        await handleRejectRfidSubmit(rejectRfidInput.trim());
                    }
                }}
            />

            {/* Update Data Modal */}
            <UpdateDataModal
                isOpen={showUpdateModal}
                rfidInputValue={rfidInputValue}
                updateFormData={updateFormData}
                isUpdating={isUpdating}
                isLoadingGarmentData={isLoadingGarmentData}
                updateMessage={updateMessage}
                allWOs={getAllWOs}
                styles={getStyles}
                buyers={getBuyers}
                items={getItems}
                colors={getColors}
                sizes={getSizes}
                woBreakdownLoading={woBreakdownQuery.isLoading}
                updateRfidInputRef={updateRfidInputRef}
                onClose={() => {
                    setShowUpdateModal(false);
                    setUpdateFormData({
                        rfid_garment: '',
                        wo: '',
                        style: '',
                        buyer: '',
                        item: '',
                        color: '',
                        size: ''
                    });
                    setUpdateMessage(null);
                }}
                onRfidInputChange={setRfidInputValue}
                onRfidKeyDown={handleRfidKeyDown}
                onWOChange={handleWOChange}
                onStyleChange={handleStyleChange}
                onBuyerChange={handleBuyerChange}
                onItemChange={handleItemChange}
                onColorChange={handleColorChange}
                onSizeChange={(size) => setUpdateFormData(prev => ({ ...prev, size }))}
                onSubmit={handleUpdateSubmit}
            />

            <ScanningRFIDNew
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    // Form data tidak di-reset, tetap tersimpan untuk registrasi berikutnya
                }}
                workOrderData={formData}
            />
        </div>
    );
});

DaftarRFID.displayName = 'DaftarRFID';

export default DaftarRFID;

