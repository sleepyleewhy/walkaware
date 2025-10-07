import { CrosswalkCoordinates } from '@/models/crosswalkCoordinates';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { toast } from 'sonner';

const UPDATE_INTERVAL_MS = 1000;

const useDriverCommuncicator = (
    dangeredCrosswalks: CrosswalkCoordinates[],
    socket: Socket,
    alertLevel: number,
    setAlertLevel: Dispatch<SetStateAction<number>>
) => {
    const intervalId = useRef<NodeJS.Timeout | null>(null);
    const joinedIds = useRef<Set<number>>(new Set());
    const activeCriticals = useRef<Set<number>>(new Set());

    const alertLevelRef = useRef(alertLevel);
    useEffect(() => {
        alertLevelRef.current = alertLevel;
    }, [alertLevel]);

    // Keep latest dangeredCrosswalks in a ref for reconnect logic
    const dangeredRef = useRef<CrosswalkCoordinates[] | undefined>(dangeredCrosswalks);
    useEffect(() => {
        dangeredRef.current = dangeredCrosswalks;
    }, [dangeredCrosswalks]);

    // Helper to get current distance for a crosswalk id
    const getDistance = useCallback((id: number): number | undefined => {
        const cw = (dangeredCrosswalks ?? []).find(c => c.id === id);
        return cw?.distance;
    }, [dangeredCrosswalks]);

    // Global listeners for server → driver notifications
    useEffect(() => {
        const handlePresence = (payload: { crosswalk_id: number; ped_count: number; driver_count: number; ts: number }) => {
            if (joinedIds.current.has(payload.crosswalk_id)) {
                console.log('presence', payload);
            }
        };

        const handleDriverCritical = (payload: { crosswalk_id: number; ts: number }) => {
            const { crosswalk_id } = payload;
            if (!joinedIds.current.has(crosswalk_id)) return;
            if (!activeCriticals.current.has(crosswalk_id)) {
                activeCriticals.current.add(crosswalk_id);
                if (alertLevelRef.current < 4) {
                    setAlertLevel(4);
                }
                toast(`Critical: pedestrian near crosswalk ${crosswalk_id}`);
            }
        };

        const handleAlertEnd = (payload: { crosswalk_id: number; ts: number }) => {
            const { crosswalk_id } = payload;
            if (!joinedIds.current.has(crosswalk_id)) return;
            if (activeCriticals.current.has(crosswalk_id)) {
                activeCriticals.current.delete(crosswalk_id);
                if (activeCriticals.current.size === 0) {
                    if (alertLevelRef.current === 4) {
                        setAlertLevel(3);
                    }
                }
            }
        };

        console.log('driver hook socket id', socket.id, 'connected', socket.connected);
        socket.on('presence', handlePresence);
        socket.on('driver_critical', handleDriverCritical);
        socket.on('alert_end', handleAlertEnd);

        return () => {
            socket.off('presence', handlePresence);
            socket.off('driver_critical', handleDriverCritical);
            socket.off('alert_end', handleAlertEnd);
        };
    }, [socket, setAlertLevel]);

    // Join/leave crosswalks based on current dangered list
    useEffect(() => {
        const newIds = new Set<number>((dangeredCrosswalks ?? []).map(cw => cw.id));
        if (alertLevel < 2) {
            const joined = joinedIds.current;
            const active = activeCriticals.current;
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
            for (const id of Array.from(joined)) {
                try {
                    socket.emit('driver_leave', { crosswalk_id: id });
                } catch {
                    // ignore
                }
            }
            active.clear();
            joined.clear();
            return;
        }
        // Leave removed crosswalks
        for (const id of Array.from(joinedIds.current)) {
            if (!newIds.has(id)) {
                try {
                    socket.emit('driver_leave', { crosswalk_id: id });
                    console.log('driver_leave', id);
                } catch {
                    // ignore
                }
                joinedIds.current.delete(id);
                activeCriticals.current.delete(id);
            }
        }

        // Enter newly added crosswalks
        for (const id of newIds) {
            if (!joinedIds.current.has(id)) {
                const distance = getDistance(id);
                const payload: { crosswalk_id: number; distance?: number } = { crosswalk_id: id };
                if (typeof distance === 'number' && isFinite(distance)) payload.distance = distance;
                try {
                    socket.emit('driver_enter', payload);
                } catch {
                    // ignore
                }
                joinedIds.current.add(id);
            }
        }

        // Start/stop periodic driver_update
        if (joinedIds.current.size > 0) {
            if (!intervalId.current) {
                intervalId.current = setInterval(() => {
                    for (const id of joinedIds.current) {
                        const distance = getDistance(id);
                        const payload: { crosswalk_id: number; distance?: number } = { crosswalk_id: id };
                        if (typeof distance === 'number' && isFinite(distance)) payload.distance = distance;
                        try {
                            socket.emit('driver_update', payload);
                        } catch {
                            // ignore
                        }
                    }
                }, UPDATE_INTERVAL_MS);
            }
        } else {
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        }

        return () => {
        };
    }, [dangeredCrosswalks, socket, getDistance, alertLevel]);

    // Unmount cleanup: leave all joined crosswalks and clear timers
    useEffect(() => {

        const joined = joinedIds.current;
        const active = activeCriticals.current;
        return () => {
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
            for (const id of Array.from(joined)) {
                try {
                    socket.emit('driver_leave', { crosswalk_id: id });
                } catch {
                    // ignore
                }
            }
            active.clear();
            joined.clear();
        };
    }, [socket]);
};

export default useDriverCommuncicator;