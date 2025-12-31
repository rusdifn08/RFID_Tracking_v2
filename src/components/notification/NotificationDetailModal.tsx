import { memo } from 'react';
import { X, CheckCircle, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import type { Notification } from '../../data/notifications';

interface NotificationDetailModalProps {
    isOpen: boolean;
    notification: Notification | null;
    onClose: () => void;
}

const NotificationDetailModal = memo(({
    isOpen,
    notification,
    onClose,
}: NotificationDetailModalProps) => {
    if (!isOpen || !notification) return null;

    const formatDate = (date: string, time: string): string => {
        try {
            const dateObj = new Date(`${date}T${time}`);
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            const dayName = days[dateObj.getDay()];
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = months[dateObj.getMonth()];
            const year = dateObj.getFullYear();
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            
            return `${dayName}, ${day}/${month}/${year}, ${hours}:${minutes}`;
        } catch {
            return `${date}, ${time}`;
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-200 animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-4 sm:p-6 border-b flex-shrink-0 ${
                    notification.type === 'optimization'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                        : notification.type === 'update'
                        ? 'bg-gradient-to-r from-green-600 to-green-700'
                        : 'bg-gradient-to-r from-yellow-600 to-yellow-700'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                {notification.type === 'optimization' ? (
                                    <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
                                ) : notification.type === 'update' ? (
                                    <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
                                ) : (
                                    <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{notification.details.title}</h3>
                                <p className="text-xs text-white/90 mt-0.5">
                                    {formatDate(notification.date, notification.time)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                        >
                            <X className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {/* Description */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {notification.details.description}
                        </p>
                    </div>

                    {/* Metrics */}
                    {notification.details.metrics && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                Performance Metrics
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Before</p>
                                    <p className="text-sm font-bold text-gray-800">{notification.details.metrics.before}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">After</p>
                                    <p className="text-sm font-bold text-green-600">{notification.details.metrics.after}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Improvement</p>
                                    <p className="text-sm font-bold text-blue-600">{notification.details.metrics.improvement}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Changes */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-600" />
                            Changes Made
                        </h4>
                        <ul className="space-y-2">
                            {notification.details.changes.map((change, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>{change}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Benefits */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            Benefits
                        </h4>
                        <ul className="space-y-2">
                            {notification.details.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
});

NotificationDetailModal.displayName = 'NotificationDetailModal';

export default NotificationDetailModal;

