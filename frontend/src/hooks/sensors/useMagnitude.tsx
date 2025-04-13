import { useEffect, useState } from "react";
import { CalculateMagnitude } from "../../utils/magnitudeCalculator";


const useMagnitude = (magnitudeDebug : boolean) => {
    const [magnitude, setMagnitude] = useState<number>(0);
    const [isMagnitudeActive, setIsMagnitudeActive] = useState<boolean>(false);


    useEffect(() => {
        const handleMotionEvent = (event: DeviceMotionEvent) => {
            if (event.acceleration) {
                setMagnitude(CalculateMagnitude(event.acceleration.x ?? 0, event.acceleration.y ?? 0, event.acceleration.z ?? 0))
            }
            else {
                throw new Error("No acceleration data available")
            }
        }

        if (window.DeviceMotionEvent && isMagnitudeActive && !magnitudeDebug) {
            window.addEventListener('devicemotion', handleMotionEvent)
        }
        else if (window.DeviceMotionEvent && !isMagnitudeActive) {
            window.removeEventListener('devicemotion', handleMotionEvent)
        }
        else {
            throw new Error("DeviceMotionEvent not available")
        }

        return () => {
            if (window.DeviceMotionEvent) {
                window.removeEventListener('devicemotion', handleMotionEvent)
            }
        }


    }, [isMagnitudeActive, magnitudeDebug])


    return {magnitude, setMagnitude, isMagnitudeActive, setIsMagnitudeActive};
    
}

export default useMagnitude;