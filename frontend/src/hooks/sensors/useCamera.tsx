import { useEffect, useRef, useState } from "react";



const useCamera = ( cameraDebug : boolean, fps: number = 2) => {
    const camera = useRef<MediaStream | null>(null);
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [imageAsBase64, setImageAsBase64] = useState<string>("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const intervalId = useRef<number | null >(null);
    const getCameraStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 640 }
                },
            });
            camera.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            console.log('Camera stream:', stream);
        } catch (err) {
            console.error('Error accessing camera:', err);
        }
    };

    const captureImage = () => {
        if (canvasRef.current && videoRef.current) {
            const ctx = canvasRef.current.getContext('2d');

            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, 640, 640);
                setImageAsBase64(canvasRef.current.toDataURL('image/jpeg'));
            }
        }
    }
    useEffect(() => {
        if (isCameraActive && !cameraDebug) {
            getCameraStream();
            intervalId.current = window.setInterval(captureImage, 1000 / fps);

        } else {
            if (camera.current){
                camera.current?.getTracks().forEach(track => track.stop());
                camera.current = null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        }




        return () => {
            if (intervalId.current) {
                clearInterval(intervalId.current);
            }
            if (camera.current) {
                camera.current.getTracks().forEach(track => { track.stop(); });
            }
        }
    }, [isCameraActive, fps, cameraDebug]);


    return { isCameraActive, setIsCameraActive, imageAsBase64, setImageAsBase64, videoRef, canvasRef};
}

export default useCamera;