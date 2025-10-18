
import PedestrianMetrics from "../../components/pedestrian/PedestrianMetrics";
import PedestrianProvider from "../../context/pedestrianProvider";
import PedestrianCalibrationDrawer from "@/components/pedestrian/PedestrianCalibrationDrawer";
import StartPedestrianButton from "@/components/pedestrian/StartPedestrianButton";
import PedestrianAlertHUD from "@/components/pedestrian/PedestrianAlertHUD";
import { usePedestrianContext } from "@/context/pedestrianContext";
import { Label } from "@/components/ui/label";
const PedestrianPage: React.FC = () => {


    const ConsentToggle: React.FC = () => {
        const { allowImageStorage, setAllowImageStorage } = usePedestrianContext();
        return (
            <div className="flex items-center space-x-2">
                <input
                    id="allowImageStorage"
                    type="checkbox"
                    checked={allowImageStorage}
                    onChange={(e) => setAllowImageStorage(e.target.checked)}
                />
                <Label htmlFor="allowImageStorage">
                    Allow saving images to improve crosswalk detection
                </Label>
            </div>
        );
    };

    return (
        <PedestrianProvider>
            <h1 className="font-extrabold text-4xl mb-4">Pedestrian Mode</h1>
            <div className="flex flex-col space-y-4 mb-5">
                <div className="flex space-x-5">
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