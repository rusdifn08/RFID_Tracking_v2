import { memo } from 'react';
import { Users, Award, Mail, Phone } from 'lucide-react';

interface TeamMember {
    name: string;
    role: string;
    image: string;
    email: string;
    phone: string;
    description: string;
    gradient: string;
}

interface TeamSectionProps {
    teamMembers: TeamMember[];
    visibleElements: Set<string>;
}

const TeamSection = memo(({ teamMembers, visibleElements }: TeamSectionProps) => {
    const isVisible = visibleElements.has('team');

    return (
        <div 
            data-fade-in="team"
            className={`max-w-7xl mx-auto mb-20 transition-all duration-700 ease-out ${
                isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
            }`}
        >
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-100 to-orange-100 backdrop-blur-xl rounded-full mb-6 border border-yellow-300 shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] transition-all duration-300 group">
                    <Users className="w-6 h-6 text-yellow-600 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-sm font-bold text-yellow-700 group-hover:text-yellow-800 transition-colors">Tim Kami</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 mb-6 animate-pulse">
                    Our Best Team
                </h2>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto backdrop-blur-sm bg-white/80 p-4 rounded-xl border border-blue-200 shadow-md">
                    Tim profesional yang berdedikasi untuk menciptakan sistem monitoring RFID terbaik
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
                <div
                    key={index}
                    className="group relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-blue-200 hover:border-blue-400 transition-all duration-500 hover:scale-105 hover:-rotate-1 shadow-xl hover:shadow-2xl overflow-hidden"
                    style={{ 
                        transitionDelay: `${index * 100}ms`,
                        transitionDuration: '800ms'
                    }}
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl`}></div>
                    
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${member.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                        <div className="relative mb-6">
                            <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center z-20 shadow-lg group-hover:scale-125 group-hover:rotate-180 transition-all duration-500">
                                <Award className="w-4 h-4 text-yellow-900" />
                            </div>
                            <div className={`w-36 h-36 mx-auto rounded-full overflow-hidden border-4 bg-gradient-to-br ${member.gradient} p-1 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-full h-full object-cover object-center group-hover:scale-125 transition-transform duration-500"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (!target.src.includes('placeholder')) {
                                                target.src = 'https://via.placeholder.com/200?text=' + encodeURIComponent(member.name.split(' ')[0]);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{member.name}</h3>
                            <p className={`text-sm font-semibold bg-gradient-to-r ${member.gradient} bg-clip-text text-transparent mb-3`}>{member.role}</p>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed group-hover:text-gray-600 transition-colors">{member.description}</p>
                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
                                    <Phone className="w-4 h-4" />
                                    <span>{member.phone}</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-700 transition-colors">
                                    <Mail className="w-4 h-4" />
                                    <a href={`mailto:${member.email}`} className="hover:underline">
                                        {member.email}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000`}></div>
                </div>
            ))}
            </div>
        </div>
    );
});

TeamSection.displayName = 'TeamSection';

export default TeamSection;

