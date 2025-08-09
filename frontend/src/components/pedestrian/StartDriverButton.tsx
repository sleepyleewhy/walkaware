import { Button } from "../ui/button";
import { useDriverContext } from "@/context/driverContext";

const StartDriverButton  : React.FC = () => {
    const context = useDriverContext();

    

    return (
    <Button onClick={() => {
        if (context.alertLevel == -1) {
            context.setAlertLevel(0);
        }
        else {
            context.setAlertLevel(-1);
        }
    }}>{context.alertLevel == -1 ? 'Start' : 'Stop'}</Button>)
}

export default StartDriverButton;