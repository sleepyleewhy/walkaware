
import { Location } from "./location"
import { Dispatch, SetStateAction } from "react";

export type PedestrianContextType = {
    location: Location,
    setLocation: Dispatch<SetStateAction<Location>>,
    isLocationActive: boolean,
    setIsLocationActive: Dispatch<SetStateAction<boolean>>,
    locationDebug: boolean,
    setLocationDebug: Dispatch<SetStateAction<boolean>>,

    
    magnitude: number,
    setMagnitude: Dispatch<SetStateAction<number>>,
    isMagnitudeActive: boolean,
    setIsMagnitudeActive: Dispatch<SetStateAction<boolean>>,
    magnitudeDebug: boolean,
    setMagnitudeDebug: Dispatch<SetStateAction<boolean>>,

    magnitudeThreshold: number,
    setMagnitudeThreshold: Dispatch<SetStateAction<number>>,

    orientation: number,
    setOrientation: Dispatch<SetStateAction<number>>,
    isOrientationActive: boolean,
    setIsOrientationActive: Dispatch<SetStateAction<boolean>>,
    orientationDebug: boolean,
    setOrientationDebug: Dispatch<SetStateAction<boolean>>,

    isCameraActive: boolean,
    setIsCameraActive: Dispatch<SetStateAction<boolean>>,
    cameraImage: string,
    setCameraImage: Dispatch<SetStateAction<string>>,
    cameraDebug: boolean,
    setCameraDebug: Dispatch<SetStateAction<boolean>>,

    alertLevel: number,
    setAlertLevel: Dispatch<SetStateAction<number>>,
    
    crosswalkId: number,
    setCrosswalkId: Dispatch<SetStateAction<number>>

    isCrosswalkDetectionActive: boolean,
    isWatchingDetectionActive: boolean,
    isCrosswalkLocatorActive: boolean
}