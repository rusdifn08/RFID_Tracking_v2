import { memo, useMemo } from 'react';
import { X, Bell, Mail, Info } from 'lucide-react';
import type { Notification } from '../../data/notifications';

interface NotificationModalProps {
    isOpen: boolean;
    notifications: Notification[];
    onClose: () => void;
    onNotificationClick: (notification: Notification) => void;
    onMarkAllAsRead: () => void;
}

const NotificationModal = memo(({
    isOpen,
    notifications,
    onClose,
    onNotificationClick,
    onMarkAllAsRead,
}: NotificationModalProps) => {
    const unreadCount = useMemo(() => 
        notifications.filter(n => !n.read).length,
        [notifications]
    );

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

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-200 animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Bell className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Your Notification</h3>
                            {unreadCount > 0 && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Bell className="w-12 h-12 mb-4 opacity-30" />
                            <p className="text-sm font-medium">No notifications</p>
                            <p className="text-xs mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => onNotificationClick(notification)}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                    notification.read
                                        ? 'bg-gray-50 border-gray-200'
                                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full flex-shrink-0 ${
                                        notification.type === 'optimization' 
                                            ? 'bg-blue-100' 
                                            : notification.type === 'update'
                                            ? 'bg-green-100'
                                            : 'bg-yellow-100'
                                    }`}>
                                        <Info className={`w-4 h-4 ${
                                            notification.type === 'optimization'
                                                ? 'text-blue-600'
                                                : notification.type === 'update'
                                                ? 'text-green-600'
                                                : 'text-yellow-600'
                                        }`} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className={`font-bold text-sm ${
                                                notification.read ? 'text-gray-700' : 'text-gray-900'
                                            }`}>
                                                {notification.title}
                                            </h4>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                            )}
                                        </div>
                                        <p className={`text-xs mt-1 ${
                                            notification.read ? 'text-gray-500' : 'text-gray-700'
                                        }`}>
                                            {formatDate(notification.date, notification.time)} : {notification.message}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium">
                                                {notification.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Actions */}
                {notifications.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-200 flex-shrink-0">
                        <button
                            onClick={onMarkAllAsRead}
                            disabled={unreadCount === 0}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Mark All as Read</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Bell className="w-4 h-4" />
                            <span>See All Notification</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

NotificationModal.displayName = 'NotificationModal';

export default NotificationModal;

