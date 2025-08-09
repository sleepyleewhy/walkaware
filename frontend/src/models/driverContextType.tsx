
import { Location } from "./location"
import { Dispatch, SetStateAction } from "react";

export type DriverContextType = {
    location: Location,
    setLocation: Dispatch<SetStateAction<Location>>,
    isLocationActive: boolean,
    setIsLocationActive: Dispatch<SetStateAction<boolean>>,
    locationDebug: boolean,
    setLocationDebug: Dispatch<SetStateAction<boolean>>,

    alertLevel: number,
    setAlertLevel: Dispatch<SetStateAction<number>>,
    
    dangeredCrosswalksId: number[],
    setDangeredCrosswalksId: Dispatch<SetStateAction<number[]>>
}