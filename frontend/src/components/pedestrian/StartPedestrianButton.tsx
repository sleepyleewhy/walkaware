import { usePedestrianContext } from "@/context/pedestrianContext"
import { Button } from "../ui/button";

const StartPedestrianButton  : React.FC = () => {
    const context = usePedestrianContext();

    

    return (
    <Button disabled={context.magnitudeThreshold <= 0} onClick={() => {
        if (context.alertLevel == -1) {
            context.setAlertLevel(0);
        }
        else {
            context.setAlertLevel(-1);
        }
    }}>{context.alertLevel == -1 ? 'Start' : 'Stop'}</Button>)
}

export default StartPedestrianButton;