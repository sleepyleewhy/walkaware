import { ReactNode, useState } from "react";
import { DriverContext } from "./driverContext";
import useLocation from "@/hooks/sensors/useLocation";
import { DriverContextType } from "@/models/driverContextType";
import useAccuracyChecker from "@/hooks/services/useAccuracyChecker";
import useRelevantCrosswalkSearcher from "@/hooks/services/useRelevantCrosswalkSearcher";
import { CrosswalkCoordinates } from "@/models/crosswalkCoordinates";
import useCrosswalkDistanceWatcher from "@/hooks/services/useCrosswalkDistanceWatcher";


type DriverProviderProps = {
    children: ReactNode;
}

const DriverProvider : React.FC<DriverProviderProps> = ({ children }) => {

    const [alertLevel, setAlertLevel] = useState<number>(-1);
    const [locationDebug, setLocationDebug] = useState<boolean>(false);
    const {location, setLocation, isLocationActive, setIsLocationActive} = useLocation(alertLevel, locationDebug);
    const [dangeredCrosswalks, setDangeredCrosswalks] = useState<CrosswalkCoordinates[]>([]);
    const [relevantCrosswalks, setRelevantCrosswalks] = useState<CrosswalkCoordinates[]>([]);

    useAccuracyChecker(location, alertLevel, setAlertLevel);
    useRelevantCrosswalkSearcher(location, alertLevel, setAlertLevel, setRelevantCrosswalks);
    useCrosswalkDistanceWatcher(alertLevel, setAlertLevel, relevantCrosswalks, setDangeredCrosswalks, location)

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