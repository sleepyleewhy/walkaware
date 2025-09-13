
import PedestrianMetrics from "../../components/pedestrian/PedestrianMetrics";
import PedestrianProvider from "../../context/pedestrianProvider";
import PedestrianCalibrationDrawer from "@/components/pedestrian/PedestrianCalibrationDrawer";
import StartPedestrianButton from "@/components/pedestrian/StartPedestrianButton";
const PedestrianPage: React.FC = () => {


    return (
        <PedestrianProvider>
            <h1 className="font-extrabold text-4xl mb-4">Pedestrian Mode</h1>
            <div className="flex space-x-5 mb-5">
            <StartPedestrianButton/>
            <PedestrianCalibrationDrawer />
            </div>
            <PedestrianMetrics />
            
            
        </PedestrianProvider>
    );
};

export default PedestrianPage;