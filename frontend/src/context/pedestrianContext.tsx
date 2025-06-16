import { createContext, useContext } from "react";
import { PedestrianContextType } from "../models/pedestrianContextType";
import { Location } from "../models/location";

const defaultLocation: Location = {
    longitude : 0,
    latitude : 0,
    accuracy: 0,
    speed: 0,
    timestamp: new Date()
}

const defaultContext: PedestrianContextType = {
    location: defaultLocation,
    setLocation: () => {},
    isLocationActive: false,
    setIsLocationActive: () => {},
    locationDebug: false,
    setLocationDebug: () => {},
    magnitude: 0,
    setMagnitude: () => {},
    isMagnitudeActive: false,
    setIsMagnitudeActive: () => {},
    magnitudeDebug: false,
    setMagnitudeDebug: () => {},
    magnitudeThreshold: 0,
    setMagnitudeThreshold: () => {},
    orientation: 0,
    setOrientation: () => {},
    isOrientationActive: false,
    setIsOrientationActive: () => {},
    orientationDebug: false,
    setOrientationDebug: () => {},
    cameraImage: "",
    setCameraImage: () => {},
    isCameraActive: false,
    setIsCameraActive: () => {},
    cameraDebug: false,
    setCameraDebug: () => {},
    alertLevel: 0,
    setAlertLevel: () => {},
    crosswalkId: 0,
    setCrosswalkId: () => {},
    isCrosswalkDetectionActive: false,
    isWatchingDetectionActive: false,
    isCrosswalkLocatorActive: false
}


export const PedestrianContext = createContext<PedestrianContextType>(defaultContext);

export const usePedestrianContext = () => {
    const context = useContext(PedestrianContext);
    if (!context) {
        console.error("usePedestrianContext must be used within a PedestrianProvider");
        throw new Error("usePedestrianContext must be used within a PedestrianProvider");

    }

    return context;
}