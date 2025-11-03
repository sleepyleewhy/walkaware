import { CrosswalkNode } from "./crosswalkNode"

export type CrosswalkWay = {
    id : number,
    nodes : CrosswalkNode[],
    angle? : number
    minlat: number,
    maxlat: number,
    minlon: number,
    maxlon: number
}