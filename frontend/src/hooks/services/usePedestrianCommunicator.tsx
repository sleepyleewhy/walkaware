import {Dispatch, SetStateAction, useCallback, useEffect, useRef} from 'react';
import { Socket } from 'socket.io-client';
import { toast } from 'sonner';

const MAX_DISTANCE = 20;
const TIMEOUT_MS = 3000;

const usePedestrianCommunicator = (crosswalkId: number, socket: Socket, alertLevel : number, setAlertLevel : Dispatch<SetStateAction<number>>) => {
    
    const intervalId = useRef<NodeJS.Timeout | null>(null);

    const lastCloseDriver = useRef<number>(0);


    const handleDriverNearby = useCallback((distance : number) => {
        if (distance < MAX_DISTANCE) {
            lastCloseDriver.current = Date.now();
            if (alertLevel !== 4) setAlertLevel(4);
        }
    }, [alertLevel, setAlertLevel])

    useEffect(() => {
        if (alertLevel >= 2 && crosswalkId != 0 && crosswalkId != null ) {

            socket.off("driver_nearby_" + crosswalkId, handleDriverNearby);
            socket.on("driver_nearby_" + crosswalkId, handleDriverNearby);
            toast("driver_nearby_" + crosswalkId);

            socket.emit("pedestrian_nearby_" + crosswalkId);
            if (!intervalId.current) {
                intervalId.current = setInterval(() => {
                    socket.emit("pedestrian_nearby_" + crosswalkId);
                    if (alertLevel === 4 && (Date.now() - lastCloseDriver.current) > TIMEOUT_MS) { 
                        setAlertLevel(3);
                    }
                }, 500);
            }

            return () => {
                socket.off("driver_nearby_" + crosswalkId, handleDriverNearby);
                if (intervalId.current) {
                    clearInterval(intervalId.current);
                    intervalId.current = null;
                }
            }

        }

        return () => {
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        }
    }, [crosswalkId, alertLevel, setAlertLevel, socket, handleDriverNearby])

};

export default usePedestrianCommunicator;