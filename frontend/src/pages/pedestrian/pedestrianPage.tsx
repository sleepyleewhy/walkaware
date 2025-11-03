
import PedestrianMetrics from "../../components/pedestrian/PedestrianMetrics";
import PedestrianProvider from "../../context/pedestrianProvider";
import PedestrianCalibrationDrawer from "@/components/pedestrian/PedestrianCalibrationDrawer";
import StartPedestrianButton from "@/components/pedestrian/StartPedestrianButton";
import PedestrianAlertHUD from "@/components/pedestrian/PedestrianAlertHUD";
import { usePedestrianContext } from "@/context/pedestrianContext";
import { Label } from "@/components/ui/label";
import { Footprints } from "lucide-react";
import { Switch } from "@/components/ui/switch";
const PedestrianPage: React.FC = () => {


    const ConsentToggle: React.FC = () => {
        const { allowImageStorage, setAllowImageStorage } = usePedestrianContext();
        return (
            <div className="flex items-center space-x-2">
                <Switch
                    id="allowImageStorage"
                    title="allow image storing"
                    checked={allowImageStorage}
                    onCheckedChange={(checked) => setAllowImageStorage(Boolean(checked))}
                />
                <Label htmlFor="allowImageStorage">
                    Allow saving camera images for future model training to improve crosswalk detection
                </Label>
            </div>
        );
    };

    return (
        <PedestrianProvider>
            <div className="flex items-center mb-3">
                <Footprints className="mr-2 size-5" /> <h1 className="font-extrabold text-2xl">Pedestrian Mode</h1></div>
            <div className="flex flex-col space-y-3 mb-4">
                <div className="flex gap-3">
                    <StartPedestrianButton/>
                    <PedestrianCalibrationDrawer />
                </div>
                <ConsentToggle />
            </div>
            <PedestrianMetrics />
            <PedestrianAlertHUD/>
        </PedestrianProvider>
    );
};

export default PedestrianPage;