import { useDriverContext } from "@/context/driverContext";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const DriverMetrics: React.FC = () => {
    const context = useDriverContext();
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

            
        </div>
    );
};

export default DriverMetrics;
