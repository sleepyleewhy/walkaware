import React, { useState, ReactNode } from "react";
import { PedestrianContextType } from "../models/pedestrianContextType";

import { PedestrianContext } from "./pedestrianContext";
import useMagnitude from "../hooks/sensors/useMagnitude";
import useOrientation from "../hooks/sensors/useOrientation";
import useLocation from "../hooks/sensors/useLocation";
import useCamera from "../hooks/sensors/useCamera";
import useCrosswalkDetection from "../hooks/services/useCrosswalkDetection";
import { useSocketContext } from "./socketContext";
import useWatchingDetection from "../hooks/services/useWatchingDetection";
import useCrosswalkLocator from "@/hooks/services/useCrosswalkLocator";

type PedestrianProviderProps = {
    children: ReactNode;
};

const PedestrianProvider: React.FC<PedestrianProviderProps> = ({
    children,
}) => {
    const [magnitudeDebug, setMagnitudeDebug] = useState<boolean>(false);
    const { magnitude, setMagnitude, isMagnitudeActive, setIsMagnitudeActive} = useMagnitude(magnitudeDebug);
    const [magnitudeThreshold, setMagnitudeThreshold] = useState<number>(0);

    const [orientationDebug, setOrientationDebug] = useState<boolean>(false);
    

    const [cameraDebug, setCameraDebug] = useState<boolean>(false);
    const {
        imageAsBase64,
        setImageAsBase64,
        isCameraActive,
        setIsCameraActive,
        canvasRef,
        videoRef
    } = useCamera(cameraDebug);

    const [alertLevel, setAlertLevel] = useState<number>(-1);

    const [locationDebug, setLocationDebug] = useState<boolean>(false);
    const { location, setLocation, isLocationActive, setIsLocationActive} = useLocation(alertLevel, locationDebug);
    const { orientation,setOrientation, isOrientationActive, setIsOrientationActive } =
        useOrientation(orientationDebug);

    const [crosswalkId, setCrosswalkId] = useState(0);
    
    const socket = useSocketContext();

    const isCrosswalkDetectionActive = useCrosswalkDetection(
        socket,
        imageAsBase64,
        alertLevel,
        setAlertLevel,
        isCameraActive,
        setIsCameraActive
    );
    const isWatchingDetectionActive = useWatchingDetection(
        magnitude,
        isMagnitudeActive,
        setIsMagnitudeActive,
        magnitudeThreshold,
        alertLevel,
        setAlertLevel
    );

    const isCrosswalkLocatorActive = useCrosswalkLocator(location, alertLevel, setCrosswalkId, orientation, isOrientationActive, setIsOrientationActive)


    const contextValue: PedestrianContextType = {
        location,
        setLocation,
        isLocationActive,
        setIsLocationActive,
        locationDebug,
        setLocationDebug,


        magnitude,
        setMagnitude,
        isMagnitudeActive,
        setIsMagnitudeActive,
        magnitudeDebug,
        setMagnitudeDebug,

        magnitudeThreshold,
        setMagnitudeThreshold,

        orientation,
        setOrientation,
        isOrientationActive,
        setIsOrientationActive,
        orientationDebug,
        setOrientationDebug,

        cameraImage: imageAsBase64,
        setCameraImage: setImageAsBase64,
        isCameraActive,
        setIsCameraActive,
        cameraDebug,
        setCameraDebug,


        alertLevel,
        setAlertLevel,

        crosswalkId,
        setCrosswalkId,

        isCrosswalkDetectionActive,
        isWatchingDetectionActive,
        isCrosswalkLocatorActive
    };

    return (
        <>
            <PedestrianContext.Provider value={contextValue}>
                {children}
            </PedestrianContext.Provider>
            <video ref={videoRef} autoPlay style={{ display: "none" }}></video>
            <canvas
                ref={canvasRef}
                style={{ display: "none" }}
                height={640}
                width={640}
            ></canvas>
        </>
    );
};

export default PedestrianProvider;
