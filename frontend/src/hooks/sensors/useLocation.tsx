import { useEffect, useState } from "react";
import { Location } from "../../models/location";


const useLocation = (alertlevel : number, locationDebug : boolean) => {
    const [location, setLocation] = useState<Location| null>(null);
    const [isLocationActive, setIsLocationActive] = useState<boolean>(false);

    useEffect(() => {
        let watchId: number;
        if (alertlevel >= 0 && !locationDebug) {
            setIsLocationActive(true);
            const handleSuccess = (position: GeolocationPosition) => {
                const { latitude, longitude, accuracy, speed } = position.coords;
    
                setLocation({ latitude, longitude, accuracy, speed, timestamp : new Date(position.timestamp)});
            };
    
            const handleError = (error: GeolocationPositionError) => {
                console.error(error);
            };
    
            if (isLocationActive && navigator.geolocation) {
                watchId = navigator.geolocation.watchPosition(
                    handleSuccess,
                    handleError,
                    {
                        enableHighAccuracy: true,
                        maximumAge: 0,
                        timeout: 3000,
                    }
                );
        }
        

            return () => {
                navigator.geolocation.clearWatch(watchId);
            };
        } else if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser");
        }

        return () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [isLocationActive, alertlevel, locationDebug]);

    return { location, setLocation, isLocationActive, setIsLocationActive};
};

export default useLocation;
