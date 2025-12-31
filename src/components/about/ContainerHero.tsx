import { memo } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import ContainerImage from '../../assets/container.webp';

interface ContainerHeroProps {
    visibleElements: Set<string>;
}

const ContainerHero = memo(({ visibleElements }: ContainerHeroProps) => {
    const isVisible = visibleElements.has('container');

    return (
        <div 
            data-fade-in="container"
            className={`max-w-6xl mx-auto mb-12 mt-4 transition-all duration-700 ease-out ${
                isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
            }`}
        >
            <div className="group relative bg-gradient-to-br from-white via-blue-50/20 to-white rounded-xl shadow-lg hover:shadow-xl overflow-hidden border border-blue-100/30 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-cyan-500/3 to-purple-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30"></div>
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center p-4 lg:p-6">
                    <div className="space-y-4 order-2 lg:order-1">
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 leading-relaxed tracking-tight" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>
                            Menyatukan Pengetahuan, Ide, dan{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 font-extrabold">
                                Teknologi Kelas Dunia
                            </span>{' '}
                            untuk Sistem Monitoring RFID Anda
                        </h1>
                        
                        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center pt-1">
                            <div className="flex-1 relative group/input">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover/input:text-blue-500 transition-colors z-10" />
                                <input
                                    type="email"
                                    placeholder="Masukan alamat surel..."
                                    className="w-full pl-10 pr-4 py-2.5 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-900 placeholder:text-gray-400 bg-white hover:border-blue-300"
                                />
                            </div>
                            <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap flex items-center justify-center gap-2 text-sm">
                                <span>Dapatkan Brosur</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                            <div className="text-center p-2.5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200 hover:bg-blue-100 hover:scale-105 transition-all duration-300 cursor-pointer group/stat">
                                <div className="text-lg md:text-xl font-black text-blue-600 group-hover/stat:scale-110 transition-transform">100%</div>
                                <div className="text-xs text-gray-600 mt-0.5 font-medium">Real-time</div>
                            </div>
                            <div className="text-center p-2.5 bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-lg border border-cyan-200 hover:bg-cyan-100 hover:scale-105 transition-all duration-300 cursor-pointer group/stat">
                                <div className="text-lg md:text-xl font-black text-cyan-600 group-hover/stat:scale-110 transition-transform">24/7</div>
                                <div className="text-xs text-gray-600 mt-0.5 font-medium">Monitoring</div>
                            </div>
                            <div className="text-center p-2.5 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200 hover:bg-purple-100 hover:scale-105 transition-all duration-300 cursor-pointer group/stat">
                                <div className="text-lg md:text-xl font-black text-purple-600 group-hover/stat:scale-110 transition-transform">99%</div>
                                <div className="text-xs text-gray-600 mt-0.5 font-medium">Accuracy</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative order-1 lg:order-2 flex items-center justify-center">
                        <div className="relative w-full max-w-md mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-200/20 via-cyan-200/20 to-purple-200/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                            
                            <div className="relative z-10">
                                <img
                                    src={ContainerImage}
                                    alt="RFID Monitoring System"
                                    className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-700"
                                    style={{ maxHeight: '320px' }}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        console.error('Error loading ContainerImage:', ContainerImage);
                                        if (!target.src.includes('placeholder')) {
                                            target.src = 'https://via.placeholder.com/500x320?text=Container+Image';
                                        }
                                    }}
                                />
                            </div>
                            
                            <div className="absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br from-blue-400/15 to-cyan-400/15 rounded-full blur-xl animate-pulse"></div>
                            <div className="absolute -bottom-3 -left-3 w-12 h-12 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                        </div>
                    </div>
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
        </div>
    );
});

ContainerHero.displayName = 'ContainerHero';

export default ContainerHero;

