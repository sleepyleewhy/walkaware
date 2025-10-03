import { ReactNode, useEffect, useRef, useState } from "react";
import { DriverContext } from "./driverContext";
import useLocation from "@/hooks/sensors/useLocation";
import { DriverContextType } from "@/models/driverContextType";
import useAccuracyChecker from "@/hooks/services/useAccuracyChecker";
import useRelevantCrosswalkSearcher from "@/hooks/services/useRelevantCrosswalkSearcher";
import { CrosswalkCoordinates } from "@/models/crosswalkCoordinates";
import useCrosswalkDistanceWatcher from "@/hooks/services/useCrosswalkDistanceWatcher";
import useDriverCommuncicator from "@/hooks/services/useDriverCommunicator";
import {useSocketContext } from "./socketContext";


type DriverProviderProps = {
    children: ReactNode;
}

const DriverProvider : React.FC<DriverProviderProps> = ({ children }) => {

    const [alertLevel, setAlertLevel] = useState<number>(-1);
    const [locationDebug, setLocationDebug] = useState<boolean>(false);
    const {location, setLocation, isLocationActive, setIsLocationActive} = useLocation(alertLevel, locationDebug);
    const [dangeredCrosswalks, setDangeredCrosswalks] = useState<CrosswalkCoordinates[]>([]);
    const [relevantCrosswalks, setRelevantCrosswalks] = useState<CrosswalkCoordinates[]>([]);
    const socket = useSocketContext();

    useAccuracyChecker(location, alertLevel, setAlertLevel);
    useRelevantCrosswalkSearcher(location, alertLevel, setAlertLevel, setRelevantCrosswalks);
    useCrosswalkDistanceWatcher(alertLevel, setAlertLevel, relevantCrosswalks, setDangeredCrosswalks, location)
    useDriverCommuncicator(dangeredCrosswalks, socket, alertLevel, setAlertLevel)
    const alertLevelRef = useRef(alertLevel);
    useEffect(() => {
        alertLevelRef.current = alertLevel;
    }, [alertLevel])

    useEffect(() => {
        socket.on("presence" , (data: { pedestrian_count: number }) => {
            console.log("[driver_communicator] presence", data);
        })
        socket.on("driver_critical", () => {
            if (alertLevelRef.current == 3) {
                setAlertLevel(4);
                console.log("[driver_communicator] driver_critical received");
            }
        })
        socket.on("alert_end", () => {
            if (alertLevelRef.current === 4) {
                setAlertLevel(3);
            }
            console.log("[driver_communicator] alert_end received");
        })

    }, [socket])



    const contextValue: DriverContextType = {
        location,
        setLocation,
        isLocationActive,
        setIsLocationActive,
        locationDebug,
        setLocationDebug,
        alertLevel,
        setAlertLevel,
        relevantCrosswalks,
        setRelevantCrosswalks,
        dangeredCrosswalks,
        setDangeredCrosswalks
    }


    return (
        <DriverContext.Provider value={contextValue}>
            {children}
        </DriverContext.Provider>
    )
}

export default DriverProvider;