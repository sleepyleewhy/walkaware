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

    const dangeredRef = useRef<CrosswalkCoordinates[] | undefined>(dangeredCrosswalks);
    useEffect(() => {
        dangeredRef.current = dangeredCrosswalks;
    }, [dangeredCrosswalks]);

    const getDistance = useCallback((id: number): number | undefined => {
        const cw = (dangeredCrosswalks ?? []).find(c => c.id === id);
        return cw?.distance;
    }, [dangeredCrosswalks]);

    useEffect(() => {
        const handlePresence = (payload: { crosswalk_id: number; ped_count: number; driver_count: number; ts: number }) => {
            if (!joinedIds.current.has(payload.crosswalk_id)) return;
            console.log('presence', payload);

            if (activeCriticals.current.size === 0) {
                if (payload.ped_count > 0) {
                    if (alertLevelRef.current < 3) {
                        setAlertLevel(3);
                    }
                }
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
                    if (alertLevelRef.current === 4) setAlertLevel(3);
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

        
        for (const id of newIds) {
            if (!joinedIds.current.has(id)) {
                const cw = (dangeredRef.current ?? []).find(c => c.id === id);
                const distance = cw?.distance;
                const payload: { crosswalk_id: number; distance?: number; speed?: number | null } = { crosswalk_id: id };
                if (typeof distance === 'number' && isFinite(distance)) payload.distance = distance;
                if (cw && typeof cw.speed === 'number' && isFinite(cw.speed)) {
                    payload.speed = cw.speed;
                } else {
                    payload.speed = null;
                }
                try {
                    socket.emit('driver_enter', payload);
                } catch {
                    // ignore
                }
                joinedIds.current.add(id);
            }
        }

        
        if (joinedIds.current.size > 0) {
            if (!intervalId.current) {
                intervalId.current = setInterval(() => {
                        for (const id of joinedIds.current) {
                            const cw = (dangeredRef.current ?? []).find(c => c.id === id);
                            const distance = cw?.distance;
                            const payload: { crosswalk_id: number; distance?: number; speed?: number | null } = { crosswalk_id: id };
                            if (typeof distance === 'number' && isFinite(distance)) payload.distance = distance;
                            if (cw && typeof cw.speed === 'number' && isFinite(cw.speed)) {
                                payload.speed = cw.speed;
                            } else {
                                payload.speed = null;
                            }
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