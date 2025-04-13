import { useEffect, useState } from "react";



const useOrientation = (orientationDebug : boolean) => {
    const [orientation, setOrientation] = useState<number>(0);
    const [isOrientationActive, setIsOrientationActive] = useState<boolean>(false);

    useEffect(() => {
        const handleOrientationEvent = (event: DeviceOrientationEvent) => {
            if (event.alpha) {
                setOrientation(event.alpha)
            }
            else {
                throw new Error("No orientation data available")
            }
        }

        if (window.DeviceOrientationEvent && isOrientationActive && !orientationDebug) {
            window.addEventListener('deviceorientationabsolute', handleOrientationEvent, true)
        }
        else if (window.DeviceOrientationEvent && !isOrientationActive ) {
            window.removeEventListener('deviceorientationabsolute', handleOrientationEvent, true)
        }
        else {
            throw new Error("DeviceOrientationEvent not available")
        }

        return () => {
            if (window.DeviceOrientationEvent) {
                window.removeEventListener('deviceorientationabsolute', handleOrientationEvent, true)
            }
        }


    }, [isOrientationActive,orientationDebug])


    return {orientation,setOrientation, isOrientationActive, setIsOrientationActive};
    
}

export default useOrientation;