import { CrosswalkCoordinates } from '@/models/crosswalkCoordinates';
import { CrosswalkNode } from '@/models/crosswalkNode';
import { CrosswalkWay } from '@/models/crosswalkWay';
import type { Location } from '@/models/location';
import { fetchCrosswalks } from '@/utils/CrosswalkLocation';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef} from 'react';

const OSRM_API_URL = 'https://router.project-osrm.org/table/v1/driving/';
const MAX_DURATION = 25; // 25 seconds

const useRelevantCrosswalkSearcher = (
    location : Location | null,
    alertlevel : number,
    setAlertLevel : Dispatch<SetStateAction<number>>,
    setRelevantCrosswalks : Dispatch<SetStateAction<CrosswalkCoordinates[]>>) => {

    const crosswalks = useRef<CrosswalkWay[]>([]);
    const crosswalksNodes = useRef<CrosswalkNode[]>([]);
        
    const intervalId = useRef<NodeJS.Timeout | null>(null); 
    
    const fetchCrosswalkDistances = useCallback(async () => {
        if (location && (crosswalks.current.length > 0 || crosswalksNodes.current.length > 0)) {
            let apiUrl = OSRM_API_URL;

            const crosswalksCoordinates: CrosswalkCoordinates[] = []
            for (const cw of crosswalks.current) {
                if (cw.nodes.length > 0) {
                    cw.nodes.forEach(node => crosswalksCoordinates.push({ lat: node.lat, lon: node.lon ,id: cw.id }));
                }
                else {
                    crosswalksCoordinates.push({ lat: cw.minlat, lon: cw.minlon, id: cw.id });
                    crosswalksCoordinates.push({ lat: cw.maxlat, lon: cw.maxlon, id: cw.id });
                }
            }
            crosswalksNodes.current.filter(node => node.isAlone).map(node => {
                crosswalksCoordinates.push({ lat: node.lat, lon: node.lon, id: node.id });
            });

            const source = location.longitude.toFixed(6) + ',' + location.latitude.toFixed(6);
            const destination = crosswalksCoordinates.map(coord => `${coord.lon.toFixed(6)},${coord.lat.toFixed(6)}`).join(';');
            apiUrl += `${source};${destination}?sources=0`
            const response = await fetch(apiUrl);
            const data = await response.json()
            
            if (!response.ok) {
                console.error('Failed to fetch crosswalk distances:', response.statusText);
                return;
            }

            if (data && data.durations && data.durations[0].length > 1) {
                const relevantCrosswalks = new Set<CrosswalkCoordinates>(); 
                for (let i = 1; i < data.durations[0].length; i++) {
                    if (data.durations[0][i] <= MAX_DURATION){
                        relevantCrosswalks.add(crosswalksCoordinates[i]);
                    }
                }
                if (relevantCrosswalks.size > 0) {
                    setRelevantCrosswalks(Array.from(relevantCrosswalks));
                    console.log(relevantCrosswalks);
                    if (alertlevel < 2) {
                        setAlertLevel(2);
                    }
                }

            }



        }

    },[location, alertlevel, setAlertLevel, setRelevantCrosswalks]);

    
    
    useEffect(() => {
        if (alertlevel >= 1 && !intervalId.current) {
            intervalId.current = setInterval(() => {
                if (location) {
                    fetchCrosswalks(location, false).then(data => {
                        crosswalks.current = data.crosswalkWays;
                        crosswalksNodes.current = data.crosswalkNodes;
                        fetchCrosswalkDistances();
                    });
                }
            }, 10000);
        } else if (alertlevel < 1 && intervalId.current ) {
            clearInterval(intervalId.current);
            intervalId.current = null;
        }
        return () => {
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        };
    }, [alertlevel, location, fetchCrosswalkDistances, intervalId]);


}

export default useRelevantCrosswalkSearcher;