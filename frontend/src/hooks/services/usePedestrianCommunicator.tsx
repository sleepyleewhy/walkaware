import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
} from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";

const MAX_DISTANCE = 100;
const TIMEOUT_MS = 3000;

const usePedestrianCommunicator = (
    crosswalkId: number,
    socket: Socket,
    alertLevel: number,
    setAlertLevel: Dispatch<SetStateAction<number>>
) => {
    const intervalId = useRef<NodeJS.Timeout | null>(null);

    const lastCloseDriver = useRef<number>(0);

    const handleDriverNearby = useCallback(
        (distance: number) => {
            toast("Driver nearby! Distance: " + distance.toFixed(1) + "m");
            if (distance < MAX_DISTANCE) {
                lastCloseDriver.current = Date.now();
                if (alertLevel !== 4) setAlertLevel(4);
            }
        },
        [alertLevel, setAlertLevel]
    );

    useEffect(() => {
        console.log('pedestrian hook socket id', socket.id, 'connected', socket.connected);
  // opcionálisan: log on connect/disconnect
        const onConnect = () => console.log('pedestrian socket connected', socket.id);
        const onDisconnect = (reason: unknown) => console.log('pedestrian socket disconnected', reason);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        if (!(alertLevel >= 2 && crosswalkId)) {
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
            return;
        }

        const eventName = `driver_nearby_${crosswalkId}`;
        // remove any previous listeners for this event (safer than passing handler reference)
        socket.off(eventName);
        socket.on(eventName, handleDriverNearby);
        console.log("listening", eventName);

        // test emit with optional ack to confirm server side saw it
        socket.emit(`pedestrian_nearby_${crosswalkId}`, undefined, (ack: unknown) => {
            console.log("pedestrian emit ack:", ack);
        });

        if (!intervalId.current) {
            intervalId.current = setInterval(() => {
                socket.emit(`pedestrian_nearby_${crosswalkId}`, undefined, (ack: unknown) => {
                    console.log("pedestrian emit ack:", ack);
                });
                if (
                    alertLevel === 4 &&
                    Date.now() - lastCloseDriver.current > TIMEOUT_MS
                ) {
                    setAlertLevel(3);
                }
            }, 500);
        }

        return () => {
            socket.off(eventName);
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        };
    }, [crosswalkId, alertLevel, socket, handleDriverNearby, setAlertLevel]);
};

export default usePedestrianCommunicator;
