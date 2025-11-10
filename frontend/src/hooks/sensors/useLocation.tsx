import { useEffect, useState, useRef } from "react";
import { Location } from "../../models/location";

// Haversine formula to calculate distance in meters between two lat/lon points
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371e3;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const useLocation = (alertlevel: number, locationDebug: boolean) => {
    const [location, setLocation] = useState<Location>({ latitude: 0, longitude: 0, accuracy: 0, speed: 0, timestamp: new Date() });
    const [isLocationActive, setIsLocationActive] = useState<boolean>(false);

    const lastPosRef = useRef<{ lat: number; lon: number; ts: number } | null>(null);
    const SPEED_AVERAGE_WINDOW = 3;
    const speedWindowRef = useRef<number[]>([]);
    const lastAvgSpeedRef = useRef<number | null>(null);

    useEffect(() => {
        let watchId: number | null = null;

        const shouldStart = alertlevel >= 0 && !locationDebug && 'geolocation' in navigator;
        if (!shouldStart) {
            if (watchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId);
            }
            setIsLocationActive(false);
            return;
        }

        setIsLocationActive(true);

        const handleSuccess = (position: GeolocationPosition) => {
            try {
                const { latitude, longitude, accuracy, speed } = position.coords;
                const ts = position.timestamp || Date.now();

                let finalSpeed: number | null = null;

                if (typeof speed === 'number' && isFinite(speed)) {
                    finalSpeed = speed;
                } else {
                    const last = lastPosRef.current;
                    if (last) {
                        const dt = (ts - last.ts) / 1000; // seconds
                        if (dt > 0.05) {
                            const dist = haversineDistanceMeters(last.lat, last.lon, latitude, longitude);
                            const computed = dist / dt;
                            if (isFinite(computed)) {
                                finalSpeed = computed;
                            }
                        }
                    }
                }
                lastPosRef.current = { lat: latitude, lon: longitude, ts };

                if (typeof finalSpeed === 'number' && isFinite(finalSpeed)) {
                    const w = speedWindowRef.current;
                    w.push(finalSpeed);
                    if (w.length > SPEED_AVERAGE_WINDOW) w.shift();
                    const sum = w.reduce((a, b) => a + b, 0);
                    const avg = sum / w.length;
                    lastAvgSpeedRef.current = avg;
                    setLocation({ latitude, longitude, accuracy, speed: avg, timestamp: new Date(ts) });
                } else {
                    const s = lastAvgSpeedRef.current;
                    setLocation({ latitude, longitude, accuracy, speed: s, timestamp: new Date(ts) });
                }
            } catch {
                //ignore
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error(error);
        };

        try {
            watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 3000,
            });
        } catch (e) {
            console.error('watchPosition failed', e);
        }

        return () => {
            if (watchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId);
            }
            setIsLocationActive(false);
        };
    }, [alertlevel, locationDebug]);

    return { location, setLocation, isLocationActive, setIsLocationActive };
};

export default useLocation;
