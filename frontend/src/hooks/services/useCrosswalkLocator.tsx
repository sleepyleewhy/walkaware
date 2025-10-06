import { CrosswalkNode } from "@/models/crosswalkNode";
import { CrosswalkWay } from "@/models/crosswalkWay";
import { Location } from "@/models/location";
import { fetchCrosswalks } from "@/utils/CrosswalkLocation";
import { SetStateAction, useCallback, useEffect, useRef, useState } from "react";

const useCrosswalkLocator = (
    location: Location | null,
    alertlevel: number,
    setCrosswalkId : React.Dispatch<SetStateAction<number>>,
    orientation: number,
    isOrientationActive: boolean,
    setIsOrientationActive: React.Dispatch<SetStateAction<boolean>>,
    ) => {


    const crosswalks = useRef<CrosswalkWay[]>([]);
    const filteredCrosswalks = useRef<CrosswalkWay[]>([]);
    const crosswalksNodes = useRef<CrosswalkNode[]>([]);
    const [isCrosswalkLocatorActive, setIsCrosswalkLocatorActive] = useState<boolean>(false);
    const intervalId = useRef<number | null>(null);
    const lastFetchAt = useRef<number>(0);
    const lastFetchLoc = useRef<Location | null>(null);
    const isFetching = useRef<boolean>(false);


    // const calculateCrosswalkAngle = useCallback((crosswalkWay: CrosswalkWay) => {
    //     if (crosswalkWay.nodes.length < 2) return -1;
    //     const toRad = (degrees: number) => degrees * (Math.PI / 180);
    //     const toDeg = (radians: number) => radians * (180 / Math.PI);

    //     const startNode = crosswalkWay.nodes[0];
    //     const endNode = crosswalkWay.nodes[crosswalkWay.nodes.length - 1];
    //     const lat1 = toRad(startNode.lat);
    //     const lat2 = toRad(endNode.lat);
    //     const londelta = toRad(endNode.lon - startNode.lon);
    //     const y = Math.sin(londelta) * Math.cos(lat2);
    //     const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(londelta);
    //     const angle = Math.atan2(y, x);


    //     return (toDeg(angle)+ 360) % 360;
    // }, [])

    const filterCrosswalksByAngle = useCallback((crosswalks: CrosswalkWay[], angleThreshold: number = 20) => {
        return crosswalks.filter((crosswalk) => {
            if (crosswalk.angle) {
                const angleDifference = Math.abs(crosswalk.angle - orientation);
                if (Math.min(Math.abs(angleDifference), Math.abs(180 - angleDifference)) < angleThreshold) {
                    return true;
                }
            }
            return false;
        })
    }, [orientation])
    // const filterNodesByAlone = (crosswalksNodes: CrosswalkNode[]) => {
    //     return crosswalksNodes.filter((crosswalkNode) => crosswalkNode.isAlone);
    // }

    


    // Haversine Formula
    const calculateNodeDistance = useCallback((node: CrosswalkNode) => {
        if (!location) return -1;
        const toRadians = (degrees: number) => degrees * (Math.PI / 180);

        const earthRadius = 6371e3; // Earth's radius in meters
        const lat1 = toRadians(location.latitude);
        const lon1 = toRadians(location.longitude);
        const lat2 = toRadians(node.lat);
        const lon2 = toRadians(node.lon);

        const deltaLat = lat2 - lat1;
        const deltaLon = lon2 - lon1;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return earthRadius * c; // Distance in meters
    }, [location]);

    const calculateWayDistance = useCallback((crosswalkWay: CrosswalkWay) => {
        let bestDistance = Infinity;

        for (const node of crosswalkWay.nodes) {
            const distance = calculateNodeDistance(node);
            if (distance < bestDistance) {
                bestDistance = distance;
            }
        }
        return bestDistance;
    },[calculateNodeDistance])




    // Fetch crosswalks from Overpass API
    // This function fetches crosswalks from the Overpass API based on the user's location
    // const getCrosswalksNearby = useCallback(async () => {
    //     if (!location) return;
    //     if (location.accuracy > 500) {
    //         console.log('accuracy too low')
    //         throw new Error("Location accuracy is too low");
    //     }
    //     try {
    //         const response = await fetch("https://overpass.private.coffee/api/interpreter",
    //             {
    //                 method: "POST",
    //                 body: `data= ${encodeURIComponent(`
    //                     [out:json];
    //                     (
    //                         way["highway"="footway"]["footway"="crossing"](around:${location.accuracy}, ${location.latitude}, ${location.longitude});
    //                         node["highway"="crossing"]["crossing:markings"="zebra"](around:${location.accuracy}, ${location.latitude}, ${location.longitude});
    //                     );
    //                     out body;
    //                     >;
    //                     out skel qt;
    //                     `)}`
    //             }
    //         ).then((res) => res.json())

    //         const allCrosswalksNodes = response.elements
    //             .filter((element: { type: string }) => element.type === 'node')
    //             .map((element: { id: number; lat: number; lon: number }) => {
    //                 const crosswalkNode: CrosswalkNode = {
    //                     id: element.id,
    //                     lon: element.lon,
    //                     lat: element.lat,
    //                     isAlone: true
    //                 };
    //                 return crosswalkNode;
    //             })
    //         crosswalks.current = response.elements
    //             .filter((element: { type: string }) => element.type === 'way')
    //             .map((element: { id: number, nodes: number[] }) => {
    //                 const crosswalkWay: CrosswalkWay = {
    //                     id: element.id,
    //                     nodes: element.nodes.map((nodeId: number) => {
    //                         const node = allCrosswalksNodes.find((node: CrosswalkNode) => node.id === nodeId)
    //                         if (node) {
    //                             node.isAlone = false;
    //                             return node;
    //                         } else {
    //                             throw new Error(`Node with id ${nodeId} not found`);
    //                         }
    //                     }),
    //                 };
    //                 crosswalkWay.angle = calculateCrosswalkAngle(crosswalkWay);
    //                 return crosswalkWay;
    //             });
    //         filteredCrosswalks.current = filterCrosswalksByAngle(crosswalks.current);
    //         crosswalksNodes.current = filterNodesByAlone(allCrosswalksNodes);
    //     } catch (err) {
    //         console.error("Error fetching crosswalks:", err);
    //     }
    // }, [location, filterCrosswalksByAngle, calculateCrosswalkAngle])


    const haversineMeters = useCallback((a: Location, b: Location) => {
        const toRad = (deg: number) => deg * Math.PI / 180;
        const R = 6371e3;
        const dLat = toRad(b.latitude - a.latitude);
        const dLon = toRad(b.longitude - a.longitude);
        const lat1 = toRad(a.latitude);
        const lat2 = toRad(b.latitude);
        const sinDlat = Math.sin(dLat / 2);
        const sinDlon = Math.sin(dLon / 2);
        const h = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlon * sinDlon;
        const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
        return R * c;
    }, []);

    // Background fetcher with caching by time and distance
    const maybeFetchCrosswalksNearby = useCallback(async () => {
        if (!location) return;
        // Skip if already fetching
        if (isFetching.current) return;

        const now = Date.now();
        const tooOld = now - lastFetchAt.current > 15000; // 60s TTL
        const movedFar = lastFetchLoc.current ? haversineMeters(lastFetchLoc.current, location) > 30 : true; // 30m threshold

        if (!tooOld && !movedFar && (crosswalks.current.length > 0 || crosswalksNodes.current.length > 0)) {
            return; // cache is fine
        }

        if (location.accuracy > 500) {
            console.log('accuracy too low');
            return; // don't block; try later when accuracy improves
        }

        try {
            isFetching.current = true;
            const response = await fetchCrosswalks(location, true);
            crosswalks.current = response.crosswalkWays;
            crosswalksNodes.current = response.crosswalkNodes.filter(node => node.isAlone);
            filteredCrosswalks.current = filterCrosswalksByAngle(crosswalks.current);
            lastFetchAt.current = Date.now();
            lastFetchLoc.current = location;
        } catch (err) {
            console.error("Error fetching crosswalks:", err);
        } finally {
            isFetching.current = false;
        }
    },[location, filterCrosswalksByAngle, haversineMeters])


    const chooseEndangeredCrosswalk = useCallback(() => {
        // Trigger background fetch if needed, but do not await to keep sub-second
        void maybeFetchCrosswalksNearby();
        let bestCrosswalk = null;
        let bestCrosswalkDistance = Infinity;

        let bestNode = null;
        let bestNodeDistance = Infinity;

        for (const crosswalk of filteredCrosswalks.current) {
            const distance = calculateWayDistance(crosswalk);
            if (distance < bestCrosswalkDistance) {
                bestCrosswalk = crosswalk;
                bestCrosswalkDistance = distance;
            }
        }
        for (const node of crosswalksNodes.current) {
            const distance = calculateNodeDistance(node);
            if (distance < bestNodeDistance) {
                bestNode = node;
                bestNodeDistance = distance;
            }
        }
        // console.log debug can be noisy; comment out for perf
        // console.log({ filtered: filteredCrosswalks.current.length, ways: crosswalks.current.length, nodes: crosswalksNodes.current.length, bestCrosswalkDistance, bestNodeDistance });

        if (!bestCrosswalk && !bestNode) return 0;
        if (!bestCrosswalk && bestNode) return bestNode.id;
        if (!bestNode && bestCrosswalk) return bestCrosswalk.id;
        if (bestCrosswalkDistance / 3 < bestNodeDistance) {

            return bestCrosswalk!.id;
        }
        else {
            return bestNode!.id;
        }
    }, [calculateNodeDistance, calculateWayDistance, maybeFetchCrosswalksNearby])


    useEffect(() => {
        
        if (alertlevel >= 2) {
            setIsCrosswalkLocatorActive(true)
            if (!isOrientationActive) {
                setIsOrientationActive(true);
            }
            if (!intervalId.current){
                intervalId.current = window.setInterval(() => {
                    let id = chooseEndangeredCrosswalk();
                    if (id === null || id === undefined) id = 0;
                    setCrosswalkId(id);
                }, 5000);
            }
            

        }
        else {
            setIsCrosswalkLocatorActive(false);
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
            setCrosswalkId(0)
            // if (isOrientationActive) {
            //     setIsOrientationActive(false);
            // }
        }
        return () => {
            setIsCrosswalkLocatorActive(false)
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
            // if (isOrientationActive) {
            //     setIsOrientationActive(false);
            // }
        }


    }, [alertlevel, setCrosswalkId, chooseEndangeredCrosswalk, isOrientationActive, setIsOrientationActive]);


    return isCrosswalkLocatorActive


}


export default useCrosswalkLocator;