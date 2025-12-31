/**
 * Data notification untuk update dan perbaikan aplikasi
 * Berdasarkan OPTIMIZE.md
 */

export interface Notification {
    id: string;
    title: string;
    message: string;
    date: string;
    time: string;
    type: 'optimization' | 'update' | 'fix';
    read: boolean;
    category: string;
    details: {
        title: string;
        description: string;
        changes: string[];
        benefits: string[];
        metrics?: {
            before: string;
            after: string;
            improvement: string;
        };
    };
}

export const notifications: Notification[] = [
    {
        id: 'opt-001',
        title: 'Optimasi ListRFIDReject.tsx',
        message: 'Komponen ListRFIDReject dipecah menjadi komponen kecil untuk performa lebih baik',
        date: '2025-01-15',
        time: '14:11',
        type: 'optimization',
        read: false,
        category: 'Component Breakdown',
        details: {
            title: 'Optimasi ListRFIDReject.tsx (958 → ~655 baris, -31.6%)',
            description: 'Komponen monolitik dengan 958 baris kode dipecah menjadi komponen-komponen kecil yang reusable dan mudah dirawat.',
            changes: [
                'ListRFIDRejectHeader.tsx - Header dengan statistik dan action buttons',
                'ListRFIDRejectFilters.tsx - Filter section dengan search dan dropdowns',
                'RejectTableHeader.tsx - Sticky table header',
                'RejectTableRow.tsx - Individual table row (dengan React.memo)',
                'RejectTable.tsx - Table container dengan loading/error states'
            ],
            benefits: [
                'Reusability - Komponen dapat digunakan kembali',
                'Maintainability - Lebih mudah dirawat dan di-debug',
                'Performance - Re-render hanya pada komponen yang berubah'
            ],
            metrics: {
                before: '958 baris',
                after: '~655 baris',
                improvement: '-31.6%'
            }
        }
    },
    {
        id: 'opt-002',
        title: 'Optimasi ListRFID.tsx',
        message: 'Komponen ListRFID dioptimasi dengan pemecahan komponen dan memoization',
        date: '2025-01-15',
        time: '14:15',
        type: 'optimization',
        read: false,
        category: 'Component Breakdown',
        details: {
            title: 'Optimasi ListRFID.tsx (757 → ~485 baris, -35.9%)',
            description: 'Komponen besar dipecah menjadi komponen-komponen kecil untuk meningkatkan performa dan maintainability.',
            changes: [
                'ListRFIDHeader.tsx - Page header dengan action buttons',
                'ListRFIDFilters.tsx - Filter section',
                'RFIDTableHeader.tsx - Table header',
                'RFIDTableRow.tsx - Table row dengan React.memo',
                'RFIDTable.tsx - Table container'
            ],
            benefits: [
                'Pengurangan ukuran file sebesar 35.9%',
                'Peningkatan performa dengan React.memo',
                'Code reusability yang lebih baik'
            ],
            metrics: {
                before: '757 baris',
                after: '~485 baris',
                improvement: '-35.9%'
            }
        }
    },
    {
        id: 'opt-003',
        title: 'Optimasi StatusRFID.tsx',
        message: 'Komponen StatusRFID dipecah menjadi 6 komponen kecil untuk performa optimal',
        date: '2025-01-15',
        time: '14:20',
        type: 'optimization',
        read: false,
        category: 'Component Breakdown',
        details: {
            title: 'Optimasi StatusRFID.tsx (527 → ~277 baris, -47.4%)',
            description: 'Komponen besar dipecah menjadi komponen-komponen kecil yang fokus pada satu tanggung jawab.',
            changes: [
                'StatusPageHeader.tsx - Page title dan description',
                'StatusInputSection.tsx - RFID input dengan validation',
                'StatusStatistics.tsx - Statistics cards (Total, Found, Not Found)',
                'StatusFiltersAndActions.tsx - Filter dan action buttons',
                'StatusResultsList.tsx - Results list container',
                'StatusItemCard.tsx - Individual status item card'
            ],
            benefits: [
                'Pengurangan ukuran file sebesar 47.4%',
                'Komponen lebih mudah dirawat',
                'Re-render yang lebih efisien'
            ],
            metrics: {
                before: '527 baris',
                after: '~277 baris',
                improvement: '-47.4%'
            }
        }
    },
    {
        id: 'opt-004',
        title: 'Optimasi Register.tsx',
        message: 'Form register dipecah menjadi komponen reusable untuk code yang lebih bersih',
        date: '2025-01-15',
        time: '14:25',
        type: 'optimization',
        read: false,
        category: 'Component Breakdown',
        details: {
            title: 'Optimasi Register.tsx (360 → ~233 baris, -35.3%)',
            description: 'Form register dipecah menjadi komponen-komponen kecil yang dapat digunakan kembali.',
            changes: [
                'RegisterHeader.tsx - Header dengan back button',
                'RegisterMessage.tsx - Error/Success message component',
                'RegisterLeftSide.tsx - Left side illustration',
                'RegisterFormField.tsx - Reusable form field component'
            ],
            benefits: [
                'Code reusability',
                'Easier maintenance',
                'Better component organization'
            ],
            metrics: {
                before: '360 baris',
                after: '~233 baris',
                improvement: '-35.3%'
            }
        }
    },
    {
        id: 'opt-005',
        title: 'Optimasi QueryClient Configuration',
        message: 'QueryClient dioptimasi dengan staleTime dan gcTime yang lebih agresif',
        date: '2025-01-15',
        time: '14:30',
        type: 'optimization',
        read: false,
        category: 'Performance',
        details: {
            title: 'Optimasi QueryClient dengan staleTime dan gcTime',
            description: 'QueryClient configuration dioptimasi untuk mengurangi API calls dan meningkatkan cache efficiency.',
            changes: [
                'staleTime: 5 menit → 10 menit',
                'gcTime: 10 menit → 30 menit',
                'refetchOnMount: false - Tidak refetch saat component mount',
                'refetchOnReconnect: false - Tidak refetch saat reconnect',
                'networkMode: online - Hanya fetch saat online'
            ],
            benefits: [
                'Mengurangi API calls yang tidak perlu',
                'Cache data lebih lama',
                'Mengurangi network traffic',
                'Better offline experience'
            ],
            metrics: {
                before: 'API calls: 150-200 per session',
                after: 'API calls: 80-100 per session',
                improvement: '-50%'
            }
        }
    },
    {
        id: 'opt-006',
        title: 'Code Splitting & Lazy Loading',
        message: 'Semua routes di-lazy load untuk mengurangi initial bundle size',
        date: '2025-01-15',
        time: '14:35',
        type: 'optimization',
        read: false,
        category: 'Performance',
        details: {
            title: 'Route-based Code Splitting dengan React.lazy',
            description: 'Semua pages di-lazy load menggunakan React.lazy untuk mengurangi initial bundle size.',
            changes: [
                'Semua pages menggunakan React.lazy',
                'Suspense boundaries untuk loading states',
                'Code splitting per route',
                'Dynamic imports untuk heavy libraries'
            ],
            benefits: [
                'Initial bundle size lebih kecil (-52%)',
                'Hanya load code yang diperlukan',
                'Faster initial page load (-53.3%)'
            ],
            metrics: {
                before: 'Initial Bundle: ~2.5 MB',
                after: 'Initial Bundle: ~1.2 MB',
                improvement: '-52%'
            }
        }
    },
    {
        id: 'opt-007',
        title: 'Debounce & Throttle Utilities',
        message: 'Utility functions untuk debounce dan throttle ditambahkan untuk optimasi event handlers',
        date: '2025-01-15',
        time: '14:40',
        type: 'update',
        read: false,
        category: 'Performance',
        details: {
            title: 'Debounce dan Throttle Utilities',
            description: 'Utility functions untuk mengoptimasi event handlers dan mengurangi function calls yang berlebihan.',
            changes: [
                'src/utils/debounce.ts - Debounce utility function',
                'src/utils/throttle.ts - Throttle utility function',
                'src/utils/useDebounce.ts - Custom hook untuk debounce value'
            ],
            benefits: [
                'Mengurangi function calls yang tidak perlu',
                'Better performance untuk input handlers',
                'Optimasi untuk search dan filter'
            ],
            metrics: {
                before: 'Multiple calls per keystroke',
                after: 'Single call setelah delay',
                improvement: 'Significant reduction'
            }
        }
    },
    {
        id: 'opt-008',
        title: 'React.memo Implementation',
        message: 'Semua komponen baru di-wrap dengan React.memo untuk mencegah re-render yang tidak perlu',
        date: '2025-01-15',
        time: '14:45',
        type: 'optimization',
        read: false,
        category: 'Performance',
        details: {
            title: 'React.memo untuk Prevent Unnecessary Re-renders',
            description: 'Semua komponen yang dibuat di-wrap dengan React.memo untuk mencegah re-render saat props tidak berubah.',
            changes: [
                'Semua komponen baru menggunakan React.memo',
                'useMemo untuk expensive computations',
                'useCallback untuk stable function references'
            ],
            benefits: [
                'Mencegah re-render yang tidak perlu',
                'Mengurangi beban rendering di browser',
                'Meningkatkan FPS (Frames Per Second)',
                'Re-renders: -70% (dari 15-20 → 3-5 per action)'
            ],
            metrics: {
                before: 'Re-renders: 15-20 per action',
                after: 'Re-renders: 3-5 per action',
                improvement: '-70%'
            }
        }
    }
];

/**
 * Get unread notifications count
 */
export const getUnreadCount = (notifications: Notification[]): number => {
    return notifications.filter(n => !n.read).length;
};

/**
 * Mark notification as read
 */
export const markAsRead = (notifications: Notification[], id: string): Notification[] => {
    return notifications.map(n => n.id === id ? { ...n, read: true } : n);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = (notifications: Notification[]): Notification[] => {
    return notifications.map(n => ({ ...n, read: true }));
};

