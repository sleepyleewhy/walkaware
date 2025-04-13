import { usePedestrianContext } from "../context/pedestrianContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const PedestrianMetrics: React.FC = () => {
    const context = usePedestrianContext();

    return (
        <div className="grid grid-cols-2 space-y-5 space-x-5 font-light">
            <Card className="bg-gray-200">
                <CardHeader>
                    <CardTitle>Alert</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Alert active: {context.alertLevel == -1 ? "No" : "Yes"}</p>
                    <p>Alert level: {context.alertLevel}</p>
                </CardContent>
            </Card>
            <Card className="bg-gray-200">
                <CardHeader>
                    <CardTitle>Crosswalk</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>
                        Crosswalk searching:{" "}
                        {context.isCrosswalkLocatorActive ? "Yes" : "No"}
                    </p>
                    <p>Crosswalk ID: {context.crosswalkId}</p>
                </CardContent>
            </Card>
            <Card className="bg-gray-200">
                <CardHeader>
                    <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Location active: {context.isLocationActive ? "Yes" : "No"}</p>
                    <p>Longitude: {context.location?.longitude}</p>
                    <p>Latitude: {context.location?.latitude}</p>
                    <p>Accuracy: {context.location?.accuracy}</p>
                    <p>Speed: {context.location?.speed}</p>
                    <p>Timestamp: {context.location?.timestamp.toLocaleDateString()}</p>
                </CardContent>
            </Card>
            <Card className="bg-gray-200">
                <CardHeader>
                    <CardTitle>Magnitude</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Magnitude active: {context.isMagnitudeActive ? "Yes" : "No"}</p>
                    <p>Magnitude: {context.magnitude}</p>
                    <p>Threshold: {context.magnitudeThreshold}</p>
                </CardContent>
            </Card>
            <Card className="bg-gray-200">
                <CardHeader>
                    <CardTitle>Orientation</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>
                        Orientation active: {context.isOrientationActive ? "Yes" : "No"}
                    </p>
                    <p>Orientation angle: {context.orientation}</p>
                </CardContent>
            </Card>
            <Card className="bg-gray-200">
                <CardHeader>
                    <CardTitle>Camera</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Camera active: {context.isCameraActive ? "Yes" : "No"}</p>
                    {context.cameraImage && (
                        <img src={context.cameraImage} alt="Camera"/>
                    )}

                </CardContent>
            </Card>
            <div>
            </div>
        </div>
    );
};

export default PedestrianMetrics;
