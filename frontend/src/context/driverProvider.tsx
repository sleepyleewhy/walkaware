import { ReactNode, useState } from "react";
import { DriverContext } from "./driverContext";
import useLocation from "@/hooks/sensors/useLocation";
import { DriverContextType } from "@/models/driverContextType";
import useAccuracyChecker from "@/hooks/services/useAccuracyChecker";
import useRelevantCrosswalkSearcher from "@/hooks/services/useRelevantCrosswalkSearcher";
import { CrosswalkCoordinates } from "@/models/crosswalkCoordinates";


type DriverProviderProps = {
    children: ReactNode;
}

const DriverProvider : React.FC<DriverProviderProps> = ({ children }) => {

    const [alertLevel, setAlertLevel] = useState<number>(-1);
    const [locationDebug, setLocationDebug] = useState<boolean>(false);
    const {location, setLocation, isLocationActive, setIsLocationActive} = useLocation(alertLevel, locationDebug);
    const [dangeredCrosswalksId, setDangeredCrosswalksId] = useState<number[]>([]);
    const [relevantCrosswalks, setRelevantCrosswalks] = useState<CrosswalkCoordinates[]>([]);

    useAccuracyChecker(location, alertLevel, setAlertLevel);
    useRelevantCrosswalkSearcher(location, alertLevel, setAlertLevel, setRelevantCrosswalks);

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
        dangeredCrosswalksId,
        setDangeredCrosswalksId
    }


    return (
        <DriverContext.Provider value={contextValue}>
            {children}
        </DriverContext.Provider>
    )
}

export default DriverProvider;