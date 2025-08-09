import { Location } from '@/models/location';
import { CrosswalkNode} from '../models/crosswalkNode' // Adjust import as needed
import { CrosswalkWay} from '../models/crosswalkWay' // Adjust import as needed

const DRIVER_FETCH_RADIUS = 200; // Default radius for fetching crosswalks in meters

export async function fetchCrosswalks(
    location: Location,
    isPedestrian: boolean
): Promise<{ crosswalkWays: CrosswalkWay[]; aloneNodes: CrosswalkNode[] }> {
    const response = await fetch("https://overpass.private.coffee/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(`
            [out:json];
            (
                way["highway"="footway"]["footway"="crossing"](around:${isPedestrian ? location.accuracy : DRIVER_FETCH_RADIUS},${location.latitude},${location.longitude});
                node["highway"="crossing"]["crossing:markings"="zebra"](around:${isPedestrian ? location.accuracy : DRIVER_FETCH_RADIUS},${location.latitude},${location.longitude});
            );
            out body;
            >;
            out skel qt;
        `)}`
    }).then((res) => res.json());

    const allCrosswalksNodes: CrosswalkNode[] = response.elements
        .filter((element: { type: string }) => element.type === 'node')
        .map((element: { id: number; lat: number; lon: number }) => ({
            id: element.id,
            lon: element.lon,
            lat: element.lat,
            isAlone: true
        }));

    const crosswalkWays: CrosswalkWay[] = response.elements
        .filter((element: { type: string }) => element.type === 'way')
        .map((element: { id: number; nodes: number[] }) => {
            const crosswalkWay: CrosswalkWay = {
                id: element.id,
                nodes: element.nodes.map((nodeId: number) => {
                    const node = allCrosswalksNodes.find((n: CrosswalkNode) => n.id === nodeId);
                    if (node) {
                        node.isAlone = false;
                        return node;
                    } else {
                        throw new Error(`Node with id ${nodeId} not found`);
                    }
                }),
            };
            if (isPedestrian) {
                crosswalkWay.angle = calculateCrosswalkAngle(crosswalkWay);
            } 
            return crosswalkWay;
        });

    const aloneNodes: CrosswalkNode[] = allCrosswalksNodes.filter(node => node.isAlone);

    return { crosswalkWays, aloneNodes };
}
const calculateCrosswalkAngle = (crosswalkWay: CrosswalkWay) => {
    if (crosswalkWay.nodes.length < 2) return -1;
    const toRad = (degrees: number) => degrees * (Math.PI / 180);
    const toDeg = (radians: number) => radians * (180 / Math.PI);

    const startNode = crosswalkWay.nodes[0];
    const endNode = crosswalkWay.nodes[crosswalkWay.nodes.length - 1];
    const lat1 = toRad(startNode.lat);
    const lat2 = toRad(endNode.lat);
    const londelta = toRad(endNode.lon - startNode.lon);
    const y = Math.sin(londelta) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(londelta);
    const angle = Math.atan2(y, x);


    return (toDeg(angle)+ 360) % 360;
}

