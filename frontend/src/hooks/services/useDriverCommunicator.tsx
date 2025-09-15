import { CrosswalkCoordinates } from '@/models/crosswalkCoordinates';
import {Dispatch, SetStateAction, useEffect, useRef} from 'react';
import { Socket } from 'socket.io-client';

const TIMEOUT_MS = 3000;

const useDriverCommuncicator = (dangeredCrosswalks: CrosswalkCoordinates[], socket: Socket, alertLevel : number, setAlertLevel : Dispatch<SetStateAction<number>>) => {
    
    const intervalId = useRef<NodeJS.Timeout | null>(null);

    const lastClosePedestrian = useRef<number>(0);

    const previousIds = useRef<Set<number>>(new Set());;

    const handlersRef = useRef<Map<number, (distance: number) => void>>(new Map());

    useEffect(() => {
        const ids = (dangeredCrosswalks ?? []).map(cw => cw.id);
        const newSet = new Set<number>(ids);

        // unsbscribe from not dangered crosswalks
        for (const id of Array.from(previousIds.current)) {
            if (!newSet.has(id)) {
                const handler = handlersRef.current.get(id);

                if (handler) {
                    socket.off("driver_nearby_" + id, handler);
                    handlersRef.current.delete(id);
                } else {
                    socket.off("driver_nearby_" + id);
                }
                previousIds.current.delete(id);
            }
        }

        for (const id of newSet) {
            if (!previousIds.current.has(id)) {
                const handler = () => {
                    lastClosePedestrian.current = Date.now();
                    if (alertLevel !== 4) setAlertLevel(4);
                }

                handlersRef.current.set(id, handler);
                socket.on("pedestrian_nearby_" + id, handler);
                socket.emit("driver_nearby_" + id);
                previousIds.current.add(id);
            }
        }
        if (previousIds.current.size > 0) {
            if (!intervalId.current) {
                intervalId.current = setInterval(() => {
                    previousIds.current.forEach(id => {
                        socket.emit("driver_nearby_" + id, dangeredCrosswalks.find(cw => cw.id === id)?.distance ?? Infinity);
                    });
                    if (alertLevel === 4 && (Date.now() - lastClosePedestrian.current) > TIMEOUT_MS) { 
                        setAlertLevel(3);
                    }
                }, 500);
            }
        }
        else {
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        }

        

        return () => {
            for (const [id, handler] of Array.from(handlersRef.current)) {
                socket.off("driver_nearby_" + id, handler);
            }
            handlersRef.current.clear();
            previousIds.current.clear();
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        }
    }, [alertLevel, dangeredCrosswalks, setAlertLevel, socket])

};

export default useDriverCommuncicator;