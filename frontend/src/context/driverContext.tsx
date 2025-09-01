import { Location } from "../models/location";
import { DriverContextType } from "../models/driverContextType";
import { createContext, useContext } from "react";

const defaultLocation: Location = {
    longitude : 0,
    latitude : 0,
    accuracy: 0,
    speed: 0,
    timestamp: new Date()
}


const defaultContext : DriverContextType = {
    location: defaultLocation,
    setLocation: () => {},
    isLocationActive: false,
    setIsLocationActive: () => {},
    locationDebug: false,
    setLocationDebug: () => {},
    alertLevel: 0,
    setAlertLevel: () => {},
    relevantCrosswalks: [],
    setRelevantCrosswalks: () => {},
    dangeredCrosswalks: [],
    setDangeredCrosswalks: () => {}
}

export const DriverContext = createContext<DriverContextType>(defaultContext);

export const useDriverContext = () => {
    const context = useContext(DriverContext);
    if (!context) {
        console.error("useDriverContext must be used within a DriverProvider");
        throw new Error("useDriverContext must be used within a DriverProvider");
    }
    return context;
}