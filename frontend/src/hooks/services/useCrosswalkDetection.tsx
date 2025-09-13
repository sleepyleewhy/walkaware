import React, { SetStateAction, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";



const useCrosswalkDetection = (socket: Socket, imageAsBase64: string, alertLevel: number, setAlertLevel: React.Dispatch<SetStateAction<number>>, 
    isCameraActive: boolean, setIsCameraActive: React.Dispatch<SetStateAction<boolean>>) => {


    const isCrosswalkDetectionActive = alertLevel >= 1;
    const noCrosswalkCounter = useRef(0);
    const user_guid = localStorage.getItem("user_guid");
    const intervalId = useRef<number | null>(null);
    const imageRef = useRef(imageAsBase64);

    useEffect(() => {
        imageRef.current = imageAsBase64;
    }, [imageAsBase64]);


    useEffect(() => {
        socket.on("predict_result_" + user_guid, (data) => {
            if (alertLevel >=1){
                if (data === true) {
                    noCrosswalkCounter.current = 0;
                    if (alertLevel === 1) {
                        setAlertLevel(2);
                    }
                }
                else {
                    if (noCrosswalkCounter.current >= 10) {
                        setAlertLevel(1);
                        noCrosswalkCounter.current = 0;
                    }
                    else {
                        noCrosswalkCounter.current++;
                    }
                }
            }

        });
    },[socket, alertLevel, user_guid, setAlertLevel] )


    useEffect(() => {
        if (alertLevel >= 1) {
            if (!isCameraActive) {
                setIsCameraActive(true);
            }
            if (intervalId.current == null) {
                intervalId.current = window.setInterval(() => {

                    if (imageRef.current != "") {
                        socket.emit("predict", user_guid, imageRef.current);
                    }
                }, 1000 / 5);
            }
            
        }
        else {
            if (isCameraActive) {
                setIsCameraActive(false);
            }
            socket.off("predict_result_" + user_guid);
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        }


    }, [alertLevel, imageAsBase64, socket, setAlertLevel, user_guid, isCameraActive, setIsCameraActive]);
    return isCrosswalkDetectionActive




}

export default useCrosswalkDetection;