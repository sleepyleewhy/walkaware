import { CrosswalkCoordinates } from "@/models/crosswalkCoordinates";
import { Location } from "@/models/location";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

const useCrosswalkDistanceWatcher = (
    alertlevel : number,
    _setAlertLevel : Dispatch<SetStateAction<number>>,
    relevantCrosswalks : CrosswalkCoordinates[],
    setDangeredCrosswalks : Dispatch<React.SetStateAction<CrosswalkCoordinates[]>>,
    location : Location | null
) => {
    const intervalId = useRef<NodeJS.Timeout | null>(null);




    function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371e3; // Earth's radius in meters
        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δφ = toRad(lat2 - lat1);
        const Δλ = toRad(lon2 - lon1);

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // distance in meters
    }
    useEffect(() => {

        if (alertlevel >= 2 && !intervalId.current) {
            intervalId.current = setInterval(() => {
                if (relevantCrosswalks.length > 0 && location != null) {
                    const withDistances = relevantCrosswalks.map(cw => ({
                        ...cw,
                        distance: calculateDistance(
                            location.latitude,
                            location.longitude,
                            cw.lat,
                            cw.lon
                        ),
                        speed: location.speed
                    }));
                    setDangeredCrosswalks(withDistances);
                }

            }, 200)
        }
        else {
            if (alertlevel < 2 && intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        }
        return () => {
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        };
    }, [alertlevel, location, relevantCrosswalks, setDangeredCrosswalks]);
}

export default useCrosswalkDistanceWatcher;