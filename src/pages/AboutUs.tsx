import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useSidebar } from '../context/SidebarContext';
import { Sparkles, Rocket, Globe, TrendingUp, Shield, Activity, ArrowRight } from 'lucide-react';
import ContainerHero from '../components/about/ContainerHero';
import FeaturesSection from '../components/about/FeaturesSection';
import TechStackSection from '../components/about/TechStackSection';
import TeamSection from '../components/about/TeamSection';
import RizkiImage from '../assets/rizki.png';
import RusdiImage from '../assets/rusdi.png';
import FrendiImage from '../assets/prendi.png';
import FebriImage from '../assets/febri.png';

const AboutUs = memo(() => {
    const { isOpen } = useSidebar();

    // scrollY digunakan untuk parallax effect pada background elements
    const [scrollY, setScrollY] = useState(0);

    // State untuk track elemen yang sudah visible (untuk fade in effect)
    const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());

    // Track scroll untuk parallax background - dioptimasi dengan useCallback
    const handleScroll = useCallback(() => {
        setScrollY(window.scrollY);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Intersection Observer untuk fade in effect - dioptimasi
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-10% 0px -10% 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const elementId = entry.target.getAttribute('data-fade-in');
                if (!elementId) return;

                if (entry.isIntersecting) {
                    setVisibleElements(prev => new Set(prev).add(elementId));
                }
            });
        }, observerOptions);

        // Observe semua elemen dengan data-fade-in attribute
        const elements = document.querySelectorAll('[data-fade-in]');
        elements.forEach(el => observer.observe(el));

        return () => {
            elements.forEach(el => observer.unobserve(el));
        };
    }, []);

    // Team members data - dioptimasi dengan useMemo
    const teamMembers = useMemo(() => [
        {
            name: 'Rizki Putra Sembiring',
            role: 'Supervisor',
            image: RizkiImage,
            email: 'rixki.putra@gistex.com',
            phone: '+62 812-3456-7890',
            description: 'Memimpin dan mengawasi seluruh proses pengembangan sistem monitoring RFID',
            gradient: 'from-yellow-400 via-orange-500 to-red-500'
        },
        {
            name: 'Rusdi Fadli Nuryuda',
            role: 'Frontend Developer',
            image: RusdiImage,
            email: 'rusdi.fadli@gistex.com',
            phone: '+62 812-3456-7891',
            description: 'Mengembangkan antarmuka pengguna yang interaktif dan responsif',
            gradient: 'from-blue-400 via-cyan-500 to-teal-500'
        },
        {
            name: 'Prendi The Backend',
            role: 'Backend Developer',
            image: FrendiImage,
            email: 'frendi.backend@gistex.com',
            phone: '+62 812-3456-7892',
            description: 'Membangun dan mengelola API serta sistem backend yang robust',
            gradient: 'from-green-400 via-emerald-500 to-teal-500'
        },
        {
            name: 'Febriansyah Dwi Makatita',
            role: 'Electrical Engineer',
            image: FebriImage,
            email: 'febriansyah.dwi@gistex.com',
            phone: '+62 812-3456-7893',
            description: 'Mengintegrasikan teknologi RFID dan MQTT untuk komunikasi real-time',
            gradient: 'from-purple-400 via-pink-500 to-rose-500'
        }
    ], []);

    return (
        <div className="flex min-h-screen bg-white relative overflow-hidden">
            {/* Animated Background Effects - Subtle untuk background putih dengan Parallax */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl animate-pulse"
                    style={{
                        transform: `translateY(${scrollY * 0.3}px)`,
                        transition: 'transform 0.1s ease-out'
                    }}
                ></div>
                <div
                    className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl animate-pulse"
                    style={{
                        animationDelay: '1s',
                        transform: `translateY(${-scrollY * 0.2}px)`,
                        transition: 'transform 0.1s ease-out'
                    }}
                ></div>
                <div
                    className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-100/20 rounded-full blur-3xl animate-pulse"
                    style={{
                        animationDelay: '2s',
                        transform: `translateY(${scrollY * 0.15}px)`,
                        transition: 'transform 0.1s ease-out'
                    }}
                ></div>
            </div>

            {/* Grid Pattern Overlay - Subtle untuk background putih */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div
                className="flex flex-col w-full h-screen transition-all duration-300 ease-in-out relative z-10 overflow-hidden"
                style={{
                    marginLeft: isOpen ? '15%' : '5rem',
                    width: isOpen ? 'calc(100% - 15%)' : 'calc(100% - 5rem)'
                }}
            >
                {/* Header */}
                <div className="flex-shrink-0">
                    <Header />
                </div>

                {/* Content - Fixed Scrolling */}
                <main
                    className="flex-1 w-full overflow-y-auto pt-20 pb-12 px-4 sm:px-6 md:px-8 lg:px-12 min-h-0"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#3b82f6 #e5e7eb'
                    }}
                >
                    <style>{`
                        main::-webkit-scrollbar {
                            width: 8px;
                        }
                        main::-webkit-scrollbar-track {
                            background: #f3f4f6;
                            border-radius: 4px;
                        }
                        main::-webkit-scrollbar-thumb {
                            background: linear-gradient(180deg, #3b82f6, #8b5cf6);
                            border-radius: 4px;
                        }
                        main::-webkit-scrollbar-thumb:hover {
                            background: linear-gradient(180deg, #2563eb, #7c3aed);
                        }
                    `}</style>

                    {/* Container/Hero Section - Compact & Seamless */}
                    <ContainerHero visibleElements={visibleElements} />

                    {/* Hero Section with Futuristic Design */}
                    <div
                        data-fade-in="hero"
                        className={`max-w-7xl mx-auto mb-20 transition-all duration-700 ease-out ${visibleElements.has('hero')
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-8'
                            }`}
                    >
                        <div className="text-center mb-16 relative">
                            {/* Glowing Badge */}
                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-100 via-cyan-100 to-blue-100 backdrop-blur-xl rounded-full mb-8 border border-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all duration-300 group">
                                <Sparkles className="w-5 h-5 text-blue-600 group-hover:rotate-180 transition-transform duration-500" />
                                <span className="text-sm font-bold text-blue-700 group-hover:text-blue-800 transition-colors">Gistex Monitoring System</span>
                                <Rocket className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Animated Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 mb-8 leading-tight animate-pulse" style={{ lineHeight: '1.2', paddingBottom: '0.5rem' }}>
                                Tentang Aplikasi Kami
                            </h1>

                            {/* Glowing Description */}
                            <div className="relative inline-block">
                                <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed relative z-10 backdrop-blur-sm bg-white/80 p-6 rounded-2xl border border-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300">
                                    Sistem monitoring RFID yang canggih untuk mengoptimalkan proses produksi garment
                                    dengan teknologi <span className="text-blue-600 font-semibold">real-time tracking</span> dan
                                    <span className="text-blue-600 font-semibold"> data analytics</span> yang komprehensif.
                                </p>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-cyan-100/50 rounded-2xl blur-xl -z-10"></div>
                            </div>
                        </div>

                        {/* Features Grid with Futuristic Cards */}
                        <FeaturesSection visibleElements={visibleElements} />
                    </div>

                    {/* Technology Stack Section with 3D Effects */}
                    <TechStackSection visibleElements={visibleElements} />

                    {/* Our Team Section with Futuristic Cards */}
                    <TeamSection teamMembers={teamMembers} visibleElements={visibleElements} />

                    {/* Additional About Section with Glassmorphism */}
                    <div
                        data-fade-in="about"
                        className={`max-w-7xl mx-auto mb-12 transition-all duration-700 ease-out ${visibleElements.has('about')
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-8'
                            }`}
                    >
                        <div className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 backdrop-blur-2xl rounded-3xl p-8 md:p-12 text-gray-900 shadow-2xl border border-blue-200 overflow-hidden group">
                            {/* Animated Background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 via-purple-100/50 to-pink-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Grid Pattern */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30"></div>

                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-6 border border-blue-300 shadow-md">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-700">Keunggulan Sistem</span>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                        Mengapa Memilih Sistem Kami?
                                    </h2>
                                    <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                                        Sistem monitoring RFID kami dirancang khusus untuk meningkatkan efisiensi
                                        dan akurasi dalam proses produksi garment. Dengan teknologi <span className="text-blue-600 font-bold">real-time tracking</span>,
                                        Anda dapat memantau setiap tahap produksi dengan detail dan presisi.
                                    </p>
                                    <div className="space-y-4">
                                        {[
                                            { title: 'Real-time Data Tracking', desc: 'Pantau pergerakan garment secara real-time dengan update otomatis', icon: Activity },
                                            { title: 'Comprehensive Analytics', desc: 'Analisis data produksi dengan dashboard yang informatif dan mudah dipahami', icon: TrendingUp },
                                            { title: 'Scalable Architecture', desc: 'Sistem yang dapat berkembang sesuai kebutuhan bisnis Anda', icon: Globe }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-200 hover:bg-white/80 hover:border-blue-300 transition-all duration-300 group/item shadow-md">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-300">
                                                    <item.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold mb-1 text-gray-900 group-hover/item:text-blue-600 transition-colors">{item.title}</h4>
                                                    <p className="text-gray-600 text-sm group-hover/item:text-gray-700 transition-colors">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 group/card">
                                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-900">
                                        <Sparkles className="w-6 h-6 text-blue-600 group-hover/card:rotate-180 transition-transform duration-500" />
                                        <span>Fitur Utama</span>
                                    </h3>
                                    <ul className="space-y-4">
                                        {[
                                            'Monitoring Real-time untuk semua Line Produksi',
                                            'Tracking RFID Garment dari awal hingga akhir',
                                            'Quality Control dengan status Good, Rework, Reject',
                                            'Dashboard Interaktif dengan Visualisasi Data',
                                            'Export Data untuk Analisis Lanjutan',
                                            'Sistem Notifikasi Real-time'
                                        ].map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-3 group/item p-2 rounded-lg hover:bg-blue-50 transition-all duration-300">
                                                <ArrowRight className="w-5 h-5 text-blue-600 group-hover/item:translate-x-2 group-hover/item:scale-125 transition-all duration-300" />
                                                <span className="text-gray-700 group-hover/item:text-blue-600 transition-colors">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
});

AboutUs.displayName = 'AboutUs';

export default AboutUs;
