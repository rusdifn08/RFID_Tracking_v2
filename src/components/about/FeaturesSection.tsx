import { memo } from 'react';
import { Monitor, Database, Radio, Target, CheckCircle2, Zap } from 'lucide-react';

interface FeaturesSectionProps {
    visibleElements: Set<string>;
}

const features = [
    {
        icon: <Monitor className="w-8 h-8" />,
        title: 'Real-time Monitoring',
        description: 'Pantau data RFID secara real-time dengan update otomatis setiap detik',
        gradient: 'from-blue-500 to-cyan-500'
    },
    {
        icon: <Database className="w-8 h-8" />,
        title: 'Data Management',
        description: 'Kelola data garment dengan sistem yang terstruktur dan mudah diakses',
        gradient: 'from-green-500 to-emerald-500'
    },
    {
        icon: <Radio className="w-8 h-8" />,
        title: 'RFID Tracking',
        description: 'Lacak perjalanan setiap garment melalui berbagai tahap produksi',
        gradient: 'from-purple-500 to-pink-500'
    },
    {
        icon: <Target className="w-8 h-8" />,
        title: 'Line Monitoring',
        description: 'Monitor performa setiap line produksi dengan dashboard interaktif',
        gradient: 'from-orange-500 to-red-500'
    },
    {
        icon: <CheckCircle2 className="w-8 h-8" />,
        title: 'Quality Control',
        description: 'Sistem kontrol kualitas dengan status Good, Rework, dan Reject',
        gradient: 'from-teal-500 to-cyan-500'
    },
    {
        icon: <Zap className="w-8 h-8" />,
        title: 'Fast & Responsive',
        description: 'Aplikasi yang cepat dan responsif dengan teknologi modern',
        gradient: 'from-yellow-500 to-orange-500'
    }
];

const FeaturesSection = memo(({ visibleElements }: FeaturesSectionProps) => {
    const isVisible = visibleElements.has('features');

    return (
        <div 
            data-fade-in="features"
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20 transition-all duration-700 ease-out ${
                isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
            }`}
        >
            {features.map((feature, index) => (
                <div
                    key={index}
                    className="group relative bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-blue-200 hover:border-blue-400 transition-all duration-500 hover:scale-105 hover:rotate-1 shadow-lg hover:shadow-2xl overflow-hidden"
                    style={{ 
                        transitionDelay: `${index * 100}ms`,
                        transitionDuration: '800ms'
                    }}
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl`}></div>
                    
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-200/0 via-cyan-300/30 to-blue-200/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10">
                        <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg`}>
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">{feature.description}</p>
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
            ))}
        </div>
    );
});

FeaturesSection.displayName = 'FeaturesSection';

export default FeaturesSection;

