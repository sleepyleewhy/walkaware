import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Footprints, MapPin, ShieldCheck, Bell, Camera, Nfc } from "lucide-react";

const Home: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="space-y-8 pb-20">
            {/* Hero */}
            <section className="text-center space-y-2">
                <h1 className="text-3xl font-extrabold trzacking-tight">WalkAware</h1>
                <p className="text-sm text-muted-foreground">
                    Avoid accidents caused by distractions with smart crosswalk awareness for pedestrians and drivers.
                </p>
            </section>

            {/* Primary actions */}
            <section className="grid grid-cols-1 gap-3">
                <Button size="lg" className="h-12 text-base" onClick={() => navigate('/pedestrian')}>
                    <Footprints className="mr-2 size-5" /> Pedestrian Mode
                </Button>
                <Button size="lg" variant="secondary" className="h-12 text-base" onClick={() => navigate('/driver')}>
                    <Car className="mr-2 size-5" /> Driver Mode
                </Button>
            </section>

            {/* How it works */}
            <section className="space-y-3">
                <h2 className="text-lg font-semibold">How it works</h2>
                <div className="grid grid-cols-1 gap-3">
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Nfc className="size-4" /> Distraction recognition
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-muted-foreground">
                            Uses your phone’s sensors to recognize when you're distracted (watching your phone) while walking.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Camera className="size-4" /> Crosswalk Detection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-muted-foreground">
                            Uses your phone’s rear camera to detect if you are stepping on a crosswalk.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="size-4" /> Location awareness
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-muted-foreground">
                            Uses your phone’s GPS to find the exact crosswalk you are stepping on/driving towards.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Bell className="size-4" /> Real-time alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-muted-foreground">
                            Get notified with audio and visual cues to avoid accidents caused by distractions.
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Privacy */}
            <section className="space-y-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ShieldCheck className="size-4" /> Privacy first
                </h2>
                <p className="text-sm text-muted-foreground">
                    Your images are never stored unless you opt in on the Pedestrian page. Your location is only stored temporarily to find relevant crosswalks around you.
                </p>
            </section>
        </div>
    );
};

export default Home;