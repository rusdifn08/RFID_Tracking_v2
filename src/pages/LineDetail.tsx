import { useParams } from 'react-router-dom';
import { memo, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Breadcrumb from '../components/Breadcrumb';
import Footer from '../components/Footer';
import { useSidebar } from '../context/SidebarContext';
import backgroundImage from '../assets/background.jpg';
import LineDetailHeader from '../components/line/LineDetailHeader';
import LineDetailCardsGrid from '../components/line/LineDetailCardsGrid';

// Material-UI Imports
import {
    Dns as DaftarRfidIcon,
    Dashboard as DashboardIcon,
    EventNote as ListRfidIcon,
} from '@mui/icons-material';

const LineDetail = memo(() => {
    const { id } = useParams<{ id: string }>();
    const { isOpen } = useSidebar();

    // --- DATA & CONFIG ---
    // Data lengkap untuk semua production lines - dioptimasi dengan useMemo
    const productionLines = useMemo(() => [
        {
            id: 1,
            title: 'Production Line 1',
            supervisor: 'Risman ',
        },
        {
            id: 2,
            title: 'Production Line 2',
            supervisor: 'Asep Supriadi',
        },
        {
            id: 3,
            title: 'Production Line 3',
            supervisor: '-',
        },
        {
            id: 4,
            title: 'Production Line 4',
            supervisor: 'Agus Bencoy',
        },
        {
            id: 5,
            title: 'Production Line 5',
            supervisor: 'Euis Sutisna',
        },
        {
            id: 6,
            title: 'Production Line 6',
            supervisor: 'Tatang Beratang',
        },
        {
            id: 7,
            title: 'Cutting Gm1',
            supervisor: 'Agus Bencoy',
        },
        {
            id: 8,
            title: 'Production Line 8',
            supervisor: 'Euis Sutisna',
        },
        {
            id: 9,
            title: 'Production Line 9',
            supervisor: 'Tatang Beratang',
        },
    ], []);

    const lineId = Number(id);
    const currentLine = useMemo(() =>
        productionLines.find(line => line.id === lineId) || {
            title: 'Line Production',
            supervisor: '-'
        },
        [productionLines, lineId]
    );

    const cards = useMemo(() => [
        {
            id: 1,
            title: 'Daftar RFID',
            subtitle: 'Registrasi Tag Baru',
            icon: DaftarRfidIcon,
            path: '/daftar-rfid',
        },
        {
            id: 2,
            title: 'Dashboard RFID',
            subtitle: 'Monitoring Real-Time',
            icon: DashboardIcon,
            path: `/dashboard-rfid/${id}`,
        },
        {
            id: 3,
            title: 'List RFID',
            subtitle: 'Database & Log',
            icon: ListRfidIcon,
            path: `/list-rfid/${id}`,
        },
    ], [id]);

    return (
        <div className="flex min-h-screen w-full h-screen font-sans text-slate-800 overflow-hidden fixed inset-0 m-0 p-0"
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
                className="flex flex-col w-full h-screen transition-all duration-300 ease-in-out relative"
                style={{
                    marginLeft: isOpen ? '18%' : '5rem',
                    width: isOpen ? 'calc(100% - 18%)' : 'calc(100% - 5rem)'
                }}
            >
                {/* Header */}
                <div className="sticky top-0 z-40 shadow-md">
                    <Header />
                </div>

                {/* Breadcrumb */}
                <Breadcrumb />

                {/* Main Content */}
                <main
                    className="flex-1 w-full overflow-y-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 relative"
                    style={{
                        paddingTop: 'clamp(0.5rem, 1vh, 1rem)',
                        paddingBottom: 'clamp(4rem, 8vh, 5rem)',
                        minHeight: 0,
                    }}
                >


                    {/* Content Container - relative untuk z-index */}
                    <div className="relative z-10">
                        {/* --- TITLE SECTION --- */}
                        <LineDetailHeader
                            supervisor={currentLine.supervisor}
                        />

                        {/* --- CARDS GRID --- */}
                        <LineDetailCardsGrid cards={cards} />
                    </div>

                </main>
                <Footer />
            </div>
        </div>
    );
});

LineDetail.displayName = 'LineDetail';

export default LineDetail;