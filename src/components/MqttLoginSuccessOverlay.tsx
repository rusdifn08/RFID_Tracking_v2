import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useMqttLoginSuccessPolling } from '../hooks/useMqttLoginSuccess';
import LoginSuccessAnimation from './LoginSuccessAnimation';

/**
 * Animasi login success: event dari MQTT via server.
 * Server (server.js) subscribe MQTT ke broker 10.5.0.106:1883; dashboard dapat event lewat polling API.
 */
export default function MqttLoginSuccessOverlay() {
    const location = useLocation();

    const currentLineId = useMemo(() => {
        const path = decodeURIComponent(location.pathname);
        const match =
            path.match(/\/dashboard-rfid\/(\d+)/i) ||
            path.match(/\/dashboard-rfid\/LINE[% ]*(\d+)/i) ||
            path.match(/\/line\/(\d+)/);
        return match ? match[1] : null;
    }, [location.pathname]);

    useMqttLoginSuccessPolling(currentLineId);

    return <LoginSuccessAnimation currentLineId={currentLineId} />;
}
