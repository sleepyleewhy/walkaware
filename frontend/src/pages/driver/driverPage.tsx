import DriverMetrics from "@/components/driver/DriverMetrics";
import StartDriverButton from "@/components/driver/StartDriverButton";
import DriverProvider from "@/context/driverProvider";
import DriverAlertHUD from "@/components/driver/DriverAlertHUD";
import { Car } from "lucide-react";

const DriverPage: React.FC = () => {


    return (
        <DriverProvider>
            <div className="flex items-center mb-3">
                <Car className="mr-2 size-5" /> <h1 className="font-extrabold text-2xl">Driver Mode</h1>
            </div>
            <StartDriverButton/>
            <DriverMetrics/>
            <DriverAlertHUD/>
            
            
        </DriverProvider>
    );
};

export default DriverPage;