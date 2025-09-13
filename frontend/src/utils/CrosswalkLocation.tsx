import { Location } from '@/models/location';
import { CrosswalkNode} from '../models/crosswalkNode' // Adjust import as needed
import { CrosswalkWay} from '../models/crosswalkWay' // Adjust import as needed

const DRIVER_FETCH_RADIUS = 200; // Default radius for fetching crosswalks in meters

export async function fetchCrosswalks(
    location: Location,
    isPedestrian: boolean
): Promise<{ crosswalkWays: CrosswalkWay[]; crosswalkNodes: CrosswalkNode[] }> {
    const response = await fetch("https://overpass.private.coffee/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(`
            [out:json];
            (
                way["highway"="footway"]["footway"="crossing"](around:${isPedestrian ? location.accuracy : DRIVER_FETCH_RADIUS},${location.latitude},${location.longitude});
                node["highway"="crossing"]["crossing:markings"="zebra"](around:${isPedestrian ? location.accuracy : DRIVER_FETCH_RADIUS},${location.latitude},${location.longitude});
            );
            out geom;
        `)}`
    }).then((res) => res.json());

    console.log('Crosswalks fetched:', response);
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
    .map((element: { id: number; nodes: number[]; geometry: { lat: number; lon: number }[] }) => {
        const nodesForWay = element.nodes
            .map(nodeId => allCrosswalksNodes.find(node => node.id === nodeId))
            .filter((node): node is CrosswalkNode => node !== undefined);

        const firstPoint = element.geometry[0];
        const lastPoint = element.geometry[element.geometry.length - 1];

        const minlat = firstPoint.lat;
        const maxlat = lastPoint.lat;
        const minlon = firstPoint.lon;
        const maxlon = lastPoint.lon;

        nodesForWay.forEach(node => node.isAlone = false);

        const crosswalkWay: CrosswalkWay = {
            id: element.id,
            nodes: nodesForWay.length > 0 ? nodesForWay : [],
            minlat,
            maxlat,
            minlon,
            maxlon
        };

        if (isPedestrian) {
            crosswalkWay.angle = calculateCrosswalkAngle(crosswalkWay);
        }
        return crosswalkWay;
    });



    return { crosswalkWays, crosswalkNodes: allCrosswalksNodes  };
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


    return (toDeg(angle) + 360) % 360;
}

