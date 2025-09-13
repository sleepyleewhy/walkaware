import { Location } from "@/models/location";
import { useEffect } from "react";


const useAccuracyChecker = (
    location: Location | null,
    alertLevel: number,
    setAlertLevel: (level: number) => void,
) => {

    useEffect(() => {
            if (alertLevel >= 0 && location) {
                if (location.accuracy > 50) {
                    if (alertLevel >= 1) {
                        setAlertLevel(0);
                    }
                } else {
                    if (alertLevel == 0) {
                        setAlertLevel(1);
                    }
                }
            }
        }, [alertLevel, location, setAlertLevel]);

}
export default useAccuracyChecker;