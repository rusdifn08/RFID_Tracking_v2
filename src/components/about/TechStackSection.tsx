import { memo } from 'react';
import { Layers, Code, Server, Cpu } from 'lucide-react';
import ReactLogo from '../../assets/react.svg';
import TailwindLogo from '../../assets/tailwind.svg';
import FlaskLogo from '../../assets/Flask.svg';
import MqttLogo from '../../assets/mqtt.svg';
import PythonLogo from '../../assets/python.svg';
import MysqlLogo from '../../assets/mysql.svg';
import RestApiLogo from '../../assets/restapi.svg';
import Esp32Logo from '../../assets/esp32.svg';
import NodeRedLogo from '../../assets/nodered.webp';

interface TechStackSectionProps {
    visibleElements: Set<string>;
}

const TechStackSection = memo(({ visibleElements }: TechStackSectionProps) => {
    const isVisible = visibleElements.has('techStack');

    return (
        <div 
            data-fade-in="techStack"
            className={`max-w-7xl mx-auto mb-20 transition-all duration-700 ease-out ${
                isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
            }`}
        >
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 backdrop-blur-xl rounded-full mb-6 border border-purple-300 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300 group">
                    <Layers className="w-6 h-6 text-purple-600 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-sm font-bold text-purple-700 group-hover:text-purple-800 transition-colors">Technology Stack</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 mb-6 leading-tight pb-2 animate-pulse" style={{ lineHeight: '1.2', paddingBottom: '0.5rem' }}>
                    Teknologi yang Digunakan
                </h2>
                <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto backdrop-blur-sm bg-white/80 p-4 rounded-xl border border-blue-200 shadow-md">
                    Kombinasi teknologi modern untuk menciptakan sistem monitoring yang powerful dan reliable
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Frontend Developer */}
                <div className="group relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-blue-200 hover:border-blue-400 transition-all duration-500 hover:scale-105 hover:-rotate-1 shadow-xl hover:shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-cyan-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                                <Code className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Frontend Developer</h3>
                                <p className="text-sm text-blue-600">UI/UX Designer & Developer</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors">
                            Mengembangkan dashboard interaktif dengan antarmuka yang modern dan user-friendly. 
                            Menampilkan data real-time dengan visualisasi yang informatif dan mudah dipahami.
                        </p>
                        <div className="space-y-3 mb-6">
                            {['TypeScript', 'Next.js Framework', 'Tailwind CSS', 'TanStack Query'].map((tech, idx) => (
                                <div key={idx} className="flex items-center gap-3 group/item">
                                    <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-md group-hover/item:scale-150 transition-transform"></div>
                                    <span className="text-gray-700 group-hover/item:text-blue-600 transition-colors font-medium">{tech}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 pt-6 border-t border-blue-200">
                            <img src={ReactLogo} alt="React" className="h-10 w-auto opacity-70 hover:opacity-100 hover:scale-110 transition-all" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <img src={TailwindLogo} alt="Tailwind" className="h-10 w-auto opacity-70 hover:opacity-100 hover:scale-110 transition-all" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>

                {/* Backend Developer */}
                <div className="group relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-green-200 hover:border-green-400 transition-all duration-500 hover:scale-105 hover:rotate-1 shadow-xl hover:shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 to-emerald-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                                <Server className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">Backend Developer</h3>
                                <p className="text-sm text-green-600">API & Data Management</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors">
                            Mengelola data dengan sistem backend yang robust menggunakan Python dan Flask. 
                            Menyediakan RESTful API yang efisien untuk komunikasi antara frontend dan database.
                        </p>
                        <div className="space-y-3 mb-6">
                            {['Python', 'Flask Framework', 'RESTful API', 'Database Management'].map((tech, idx) => (
                                <div key={idx} className="flex items-center gap-3 group/item">
                                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full shadow-md group-hover/item:scale-150 transition-transform"></div>
                                    <span className="text-gray-700 group-hover/item:text-green-600 transition-colors font-medium">{tech}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 pt-6 border-t border-green-200 flex-wrap">
                            <img src={PythonLogo} alt="Python" className="h-8 w-auto opacity-70 hover:opacity-100 hover:scale-110 transition-all" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <img src={MysqlLogo} alt="MySQL" className="h-8 w-auto opacity-70 hover:opacity-100 hover:scale-110 transition-all" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <img src={RestApiLogo} alt="REST API" className="h-8 w-auto opacity-70 hover:opacity-100 hover:scale-110 transition-all" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <img src={FlaskLogo} alt="Flask" className="h-8 w-auto opacity-70 hover:opacity-100 hover:scale-110 transition-all" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>

                {/* Electrical Engineer */}
                <div className="group relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-purple-200 hover:border-purple-400 transition-all duration-500 hover:scale-105 hover:-rotate-1 shadow-xl hover:shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-pink-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                                <Cpu className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Electrical Engineer</h3>
                                <p className="text-sm text-purple-600">RFID & IoT Integration</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors">
                            Mengintegrasikan teknologi RFID dan MQTT untuk komunikasi real-time. 
                            Memastikan sistem hardware dan software bekerja secara seamless untuk monitoring yang akurat.
                        </p>
                        <div className="space-y-3 mb-6">
                            {['RFID Technology', 'MQTT Protocol', 'IoT Integration', 'Hardware Communication'].map((tech, idx) => (
                                <div key={idx} className="flex items-center gap-3 group/item">
                                    <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full shadow-md group-hover/item:scale-150 transition-transform"></div>
                                    <span className="text-gray-700 group-hover/item:text-purple-600 transition-colors font-medium">{tech}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 pt-6 border-t border-purple-200 flex-wrap">
                            <img src={MqttLogo} alt="MQTT" className="h-8 w-auto opacity-70 hover:opacity-100 hover:scale-110 transition-all" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <img src={Esp32Logo} alt="ESP32" className="h-8 w-auto opacity-70 hover:opacity-100 hover:scale-110 transition-all" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <img src={NodeRedLogo} alt="Node-RED" className="h-8 w-auto opacity-70 hover:opacity-100 hover:scale-110 transition-all" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-200/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
            </div>
        </div>
    );
});

TechStackSection.displayName = 'TechStackSection';

export default TechStackSection;

