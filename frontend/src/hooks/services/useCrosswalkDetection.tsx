import React, { SetStateAction, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";



const useCrosswalkDetection = (
    socket: Socket,
    imageAsBase64: string,
    alertLevel: number,
    setAlertLevel: React.Dispatch<SetStateAction<number>>,
    isCameraActive: boolean,
    setIsCameraActive: React.Dispatch<SetStateAction<boolean>>,
    allowImageStorage: boolean
) => {


    const isCrosswalkDetectionActive = alertLevel >= 1;
    const noCrosswalkCounter = useRef(0);
    const intervalId = useRef<number | null>(null);
    const imageRef = useRef(imageAsBase64);
    
    useEffect(() => {
        imageRef.current = imageAsBase64;
    }, [imageAsBase64]);
    
    const user_guid = localStorage.getItem("user_guid");
    const alertlevelRef = useRef(alertLevel);

    useEffect(() => {
        alertlevelRef.current = alertLevel;
    }, [alertLevel]);

    useEffect(() => {
        socket.on("predict_result_" + user_guid, (data) => {
            if (alertlevelRef.current >= 1) {
                if (data === true) {
                    noCrosswalkCounter.current = 0;
                    if (alertlevelRef.current === 1) {
                        setAlertLevel(2);
                    }
                } else {                   
                    noCrosswalkCounter.current++;
                    if (noCrosswalkCounter.current >= 5) {
                        setAlertLevel(1);
                        noCrosswalkCounter.current = 0;
                    }
                }
            }
        });

        return () => {
            socket.off("predict_result_" + user_guid);
        }
    },[socket, setAlertLevel, user_guid] )


    useEffect(() => {
        if (alertLevel >= 1) {
            if (!isCameraActive) {
                setIsCameraActive(true);
            }
            if (intervalId.current == null) {
                intervalId.current = window.setInterval(() => {

                    if (imageRef.current != "") {
                        socket.emit("predict", user_guid, imageRef.current, allowImageStorage);
                    }
                }, 1000 / 3);
            }
            
        }
        else {
            if (isCameraActive) {
                setIsCameraActive(false);
            }
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        }
        return () => {
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        }
            


    }, [alertLevel, socket, user_guid, isCameraActive, setIsCameraActive, allowImageStorage]);
    return isCrosswalkDetectionActive




}

export default useCrosswalkDetection;