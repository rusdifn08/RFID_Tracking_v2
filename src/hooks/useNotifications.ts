import { useState, useCallback, useMemo } from 'react';
import { notifications as initialNotifications, markAsRead, markAllAsRead, getUnreadCount, type Notification } from '../data/notifications';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [showModal, setShowModal] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const unreadCount = useMemo(() => getUnreadCount(notifications), [notifications]);

    const handleNotificationClick = useCallback((notification: Notification) => {
        // Mark as read
        setNotifications(prev => markAsRead(prev, notification.id));
        // Show detail modal
        setSelectedNotification(notification);
        setShowDetailModal(true);
        setShowModal(false);
    }, []);

    const handleMarkAllAsRead = useCallback(() => {
        setNotifications(prev => markAllAsRead(prev));
    }, []);

    const handleCloseDetailModal = useCallback(() => {
        setShowDetailModal(false);
        setSelectedNotification(null);
    }, []);

    return {
        notifications,
        unreadCount,
        showModal,
        showDetailModal,
        selectedNotification,
        setShowModal,
        handleNotificationClick,
        handleMarkAllAsRead,
        handleCloseDetailModal,
    };
};

