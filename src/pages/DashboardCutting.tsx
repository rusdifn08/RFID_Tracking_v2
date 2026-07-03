import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CuttingProcessSection from '../components/dashboard/cutting/CuttingProcessSection';
import backgroundImage from '../assets/background.jpg';

export default function DashboardCutting() {
    return (
        <div className="flex h-screen w-full font-sans text-slate-800 bg-slate-50 overflow-hidden selection:bg-sky-100 selection:text-sky-900">
            <div
                className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' }}
            />

            <div className="fixed left-0 top-0 h-full z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300">
                <Sidebar />
            </div>

            <div
                className="flex flex-col h-full min-h-0 min-w-0 relative z-10 transition-all duration-300 ease-in-out"
                style={{
                    marginLeft: 'var(--layout-sidebar-offset)',
                    width: 'var(--layout-sidebar-width)',
                }}
            >
                <Header />

                <main className="flex flex-col flex-1 min-h-0 w-full bg-slate-50/50 px-2 md:px-3 pb-2 md:pb-3 pt-10 xs:pt-12 sm:pt-14 md:pt-[3.5rem] lg:pt-[4.5rem] overflow-hidden">
                    <div className="flex-1 min-h-0 min-w-0 flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.06)] p-2 md:p-3 overflow-hidden">
                        <CuttingProcessSection filterTablesToToday homeDashboardApi />
                    </div>
                </main>
            </div>
        </div>
    );
}
