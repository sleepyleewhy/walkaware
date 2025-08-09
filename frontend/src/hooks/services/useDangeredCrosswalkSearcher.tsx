import { CrosswalkNode } from '@/models/crosswalkNode';
import { CrosswalkWay } from '@/models/crosswalkWay';
import { Location } from '@/models/location';
import { fetchCrosswalks } from '@/utils/CrosswalkLocation';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

const OSRM_API_URL = 'http://routing.openstreetmap.de/table/v1/car/';

const useDangeredCrosswalkSearcher = (
    location : Location | null,
    alertlevel : number,
    setAlertLevel : Dispatch<SetStateAction<number>>,
    setDangeredCrosswalksId : Dispatch<SetStateAction<number[]>>) => {

    const crosswalks = useRef<CrosswalkWay[]>([]);
    const crosswalksNodes = useRef<CrosswalkNode[]>([]);
        
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    
    
    useEffect(() => {
        if (alertlevel >= 1) {
            if (!intervalId) {
                const id = setInterval(() => {
                    if (location) {
                        fetchCrosswalks(location, false).then(data => {
                            crosswalks.current = data.crosswalkWays;
                            crosswalksNodes.current = data.aloneNodes;
                        })
                        // TODO: Calculate duration to the crosswalks with OSRM API table mode.
                    }
                    
                }, 2000);
                setIntervalId(id);
            }
        } else {
            if (intervalId) {
                clearInterval(intervalId);
                setIntervalId(null);
            }
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                setIntervalId(null);
            }
        };
    }, [alertlevel, intervalId]);


}

export default useDangeredCrosswalkSearcher;