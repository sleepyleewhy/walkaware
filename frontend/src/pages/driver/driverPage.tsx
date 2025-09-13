import DriverMetrics from "@/components/driver/DriverMetrics";
import StartDriverButton from "@/components/driver/StartDriverButton";
import DriverProvider from "@/context/driverProvider";

const DriverPage: React.FC = () => {


    return (
        <DriverProvider>
            <h1 className="font-extrabold text-4xl mb-4">Driver Mode</h1>
                            <StartDriverButton/>
            <div className="flex space-x-5 mb-5">
                <DriverMetrics/>
            </div>
            
            
        </DriverProvider>
    );
};

export default DriverPage;