import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Breadcrumb from '../components/Breadcrumb';
import Footer from '../components/Footer';
import backgroundImage from '../assets/background.jpg';
import cardShipment from '../assets/shipment.webp';
import cardContainer from '../assets/container.webp';
import { LayoutGrid, ExternalLink } from 'lucide-react';

type HubCard = {
  id: number;
  title: string;
  subtitle: string;
  to: string;
  isExternal: boolean;
  iconText: string;
  artSrc?: string;
  artAlt?: string;
  gradient: string;
  bar: string;
};

const cards: HubCard[] = [
  {
    id: 1,
    title: 'Monitoring Shipment GM 1',
    subtitle: 'Dashboard Proses Serah Terima & Monitoring Shipment GM 1',
    to: '/monitoring-shipment/gm1',
    isExternal: false,
    iconText: 'GM 1',
    gradient: 'from-cyan-400 to-blue-600',
    bar: 'from-cyan-400 to-blue-600',
  },
  {
    id: 2,
    title: 'Monitoring Shipment GM 2',
    subtitle: 'Dashboard Proses Serah Terima & Monitoring Shipment GM 2',
    to: '/monitoring-shipment/gm2',
    isExternal: false,
    iconText: 'GM 2',
    gradient: 'from-sky-400 to-indigo-600',
    bar: 'from-sky-400 to-indigo-600',
  },
];

export default function MonitoringShipmentHub() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<number | null>(null);

  const handleNavigation = (c: HubCard) => {
    if (c.isExternal) {
      window.open(c.to, '_blank', 'noopener,noreferrer');
    } else {
      navigate(c.to);
    }
  };

  return (
    <div
      className="flex min-h-screen w-full h-screen fixed inset-0 m-0 p-0"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <Sidebar />
      <div
        className="flex flex-col w-full min-h-screen transition-all duration-300 ease-in-out relative"
        style={{
          marginLeft: 'var(--layout-sidebar-offset)',
          width: 'var(--layout-sidebar-width)',
        }}
      >
        <Header />
        <Breadcrumb />
        <main
          className="flex-1 w-full overflow-y-auto relative"
          style={{
            padding: 'clamp(0.5rem, 2vw, 2rem) clamp(0.5rem, 3vw, 1rem)',
            paddingTop: '0.75rem',
            paddingBottom: '4rem',
          }}
        >
          <div className="w-full max-w-5xl mx-auto pt-2">
            <p className="text-center text-[clamp(0.65rem,0.8vw,0.75rem)] font-semibold uppercase tracking-widest text-blue-600 mb-1">
              Shipment Module
            </p>
            <h1 className="text-center text-[clamp(1.1rem,2.2vw,1.6rem)] font-extrabold text-slate-900 mb-8">
              Pilih area Shipment
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {cards.map((c, index) => {
                const isCardHover = hovered === c.id;
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigation(c)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' ? handleNavigation(c) : null)}
                    onMouseEnter={() => setHovered(c.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`
                      group relative bg-white rounded-2xl md:rounded-3xl border border-slate-100
                      shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)]
                      cursor-pointer flex flex-col transition-all duration-500
                      hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]
                      overflow-hidden
                    `}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      aspectRatio: '5/3',
                      minHeight: 'clamp(120px, 24vh, 240px)',
                      padding: 'clamp(0.75rem, 2vw, 1.25rem)',
                    }}
                  >
                    <div
                      className={`absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-gradient-to-r ${c.bar} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none rounded-2xl md:rounded-3xl`}
                    />
                    <div className="flex flex-col items-center justify-center w-full flex-1 gap-2 sm:gap-3">
                      <div
                        className="relative flex w-full items-center justify-center transition-transform duration-500 group-hover:scale-[1.03]"
                        style={{
                          height: 'clamp(4.25rem, 15vw, 7rem)',
                        }}
                      >
                        <span 
                            className={`font-black text-transparent bg-clip-text bg-gradient-to-br ${c.gradient}`}
                            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1, filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }}
                        >
                            {c.iconText}
                        </span>
                      </div>
                      <h2
                        className="font-bold text-center text-slate-900 w-full"
                        style={{
                          fontSize: 'clamp(0.95rem, 1.8vw, 1.5rem)',
                          lineHeight: 1.3,
                          color: isCardHover ? '#1e293b' : '#0f172a',
                        }}
                      >
                        {c.title}
                      </h2>
                      <p
                        className="text-slate-500 text-center w-full px-2"
                        style={{ fontSize: 'clamp(0.65rem, 1.1vw, 0.8rem)', lineHeight: 1.45 }}
                      >
                        {c.subtitle}
                      </p>
                      <span
                        className="inline-flex items-center gap-1.5 text-[clamp(0.6rem,0.95vw,0.7rem)] font-semibold text-blue-600 opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-8 transition-all duration-300"
                      >
                        {c.isExternal ? <ExternalLink className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
                        Buka
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
