import { usePedestrianContext } from "../../context/pedestrianContext";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const PedestrianMetrics: React.FC = () => {
    const context = usePedestrianContext();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 space-y-5 space-x-5">
            {/* Alert Card */}
            <Card className="bg-gray-100">
                <CardHeader>
                    <CardTitle>Alert</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="alertlevel">Alert level</Label>
                        <Input type="number" id="alertlevel" value={context.alertLevel} disabled />
                    </div>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="alertactive">Alerting active</Label>
                        <Input type="text" id="alertactive" value={context.alertLevel == -1 ? "No" : "Yes"} disabled />
                    </div>
                </CardContent>
            </Card>

            {/* Crosswalk Card */}
            <Card className="bg-gray-100">
                <CardHeader>
                    <CardTitle>Crosswalk</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="crosswalksearch">Crosswalk searching</Label>
                        <Input type="text" id="crosswalksearch" value={context.isCrosswalkLocatorActive ? "Yes" : "No"} disabled />
                    </div>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="crosswalkid">Crosswalk ID</Label>
                        <Input type="number" id="crosswalkid" value={context.crosswalkId} disabled />
                    </div>
                </CardContent>
            </Card>

            {/* Location Card */}
            <Card className="bg-gray-100">
                <CardHeader>
                    <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="locationactive">Location active</Label>
                        <Input type="text" id="locationactive" value={context.isLocationActive ? "Yes" : "No"} disabled />
                    </div>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input type="number" id="longitude" value={context.location.longitude} disabled={!context.locationDebug}
                        onChange={(e) => context.setLocation({...context.location, longitude: Number(e.target.value)})} />
                    </div>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input type="number" id="latitude" value={context.location.latitude} disabled={!context.locationDebug} 
                        onChange={(e) => context.setLocation({...context.location, latitude: Number(e.target.value)})} />

                    </div>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="accuracy">Accuracy</Label>
                        <Input type="number" id="accuracy" value={context.location.accuracy} disabled={!context.locationDebug} 
                        onChange={(e) => context.setLocation({...context.location, accuracy: Number(e.target.value)})} />

                    </div>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="speed">Speed</Label>
                        <Input type="number" id="speed" value={context.location?.speed || 0} disabled={!context.locationDebug} 
                        onChange={(e) => context.setLocation({...context.location, speed: Number(e.target.value)})} />

                    </div>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="timestamp">Timestamp</Label>
                        <Input type="text" id="timestamp" value={context.location?.timestamp.toLocaleDateString() || ""} disabled />
                    </div>
                </CardContent>
                {import.meta.env.DEV &&
                    <CardFooter>
                        <Button variant={"outline"}
                            className={context.locationDebug ? 'bg-green-600 hover:bg-green-700 hover:text-white text-white' : ''}
                            onClick={() => context.setLocationDebug(!context.locationDebug)}>Debug</Button>
                    </CardFooter>}

            </Card>

            {/* Magnitude Card */}
            <Card className="bg-gray-100">
                <CardHeader>
                    <CardTitle>Magnitude</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="magnitudeactive">Magnitude active</Label>
                        <Input type="text" id="magnitudeactive" value={context.isMagnitudeActive ? "Yes" : "No"} disabled />
                    </div>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="magnitude">Magnitude</Label>
                        <Input type="number" id="magnitude" 
                        value={context.magnitude} 
                        disabled={!context.magnitudeDebug}
                        onChange={(e) => context.setMagnitude(Number(e.target.value))} />
                    </div>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="threshold">Threshold</Label>
                        <Input type="number" id="threshold" 
                        value={context.magnitudeThreshold} 
                        disabled={!context.magnitudeDebug}
                        onChange={(e) => context.setMagnitudeThreshold(Number(e.target.value))} />
                    </div>
                </CardContent>
                {import.meta.env.DEV &&
                    <CardFooter>
                        <Button variant={"outline"}
                            className={context.magnitudeDebug ? 'bg-green-600 hover:bg-green-700 hover:text-white text-white' : ''}
                            onClick={() => context.setMagnitudeDebug(!context.magnitudeDebug)}>Debug</Button>
                    </CardFooter>}
            </Card>

            <Card className="bg-gray-100">
                <CardHeader>
                    <CardTitle>Orientation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="orientationactive">Orientation active</Label>
                        <Input type="text" id="orientationactive" value={context.isOrientationActive ? "Yes" : "No"} disabled />
                    </div>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="orientationangle">Orientation angle</Label>
                        <Input type="number" id="orientationangle" value={context.orientation} disabled={!context.orientationDebug}
                        onChange={(e) => context.setOrientation(Number(e.target.value))}/>
                    </div>
                </CardContent>
                {import.meta.env.DEV &&
                    <CardFooter>
                        <Button variant={"outline"}
                            className={context.orientationDebug ? 'bg-green-600 hover:bg-green-700 hover:text-white text-white' : ''}
                            onClick={() => context.setOrientationDebug(!context.orientationDebug)}>Debug</Button>
                    </CardFooter>}
            </Card>
            <Card className="bg-gray-100 mb-5 mr-5">
                <CardHeader>
                    <CardTitle>Camera</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full gap-2 mb-2">
                        <Label htmlFor="cameraactive">Camera active</Label>
                        <Input type="text" id="cameraactive" value={context.isCameraActive ? "Yes" : "No"} disabled />
                        {context.cameraDebug &&
                        <>
                        <Label htmlFor="imagestring">Image string</Label>
                        <Input type="text" id="imagestring" value={context.cameraImage}
                        onChange={(e) => context.setCameraImage(e.target.value)}/>
                        </> }
                    </div>
                    {context.cameraImage && (
                        <div className="grid w-full gap-2 mb-2">
                            <Label htmlFor="cameraimage">Camera Image</Label>
                            <img
                                src={context.cameraImage}
                                alt="Camera"
                                id="cameraimage"
                                className="max-w-full h-auto"
                            />
                        </div>
                    )}
                </CardContent>
                {import.meta.env.DEV &&
                    <CardFooter>
                        <Button variant={"outline"}
                            className={context.cameraDebug ? 'bg-green-600 hover:bg-green-700 hover:text-white text-white' : ''}
                            onClick={() => context.setCameraDebug(!context.cameraDebug)}>Debug</Button>
                    </CardFooter>}
            </Card>
        </div>
    );
};

export default PedestrianMetrics;
