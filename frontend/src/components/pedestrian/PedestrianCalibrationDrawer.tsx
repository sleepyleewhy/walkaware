import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "../ui/button";
import { usePedestrianContext } from "@/context/pedestrianContext";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";


const PedestrianCalibrationDrawer: React.FC = () => {
    const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
    const [isCalibrateWatching, setIsCalibrateWatching] = useState<boolean>(false);

    const context = usePedestrianContext();
    const [watchingValues, setWatchingValues] = useState<number[]>([]);
    const [notWatchingValues, setNotWatchingValues] = useState<number[]>([]);
    const watchingAverage = useRef(0);
    const notWatchingAverage = useRef(0);

    useEffect(() => {
        if (isCalibrating) {
            context.setIsMagnitudeActive(true);
            if (isCalibrateWatching) {
                setWatchingValues([...watchingValues, context.magnitude]);
            }
            else {
                setNotWatchingValues([...notWatchingValues, context.magnitude]);
            }
        }
    }, [context.magnitude, isCalibrating, isCalibrateWatching, watchingValues, notWatchingValues, context])

    useEffect(() => {
        if (watchingValues.length > 0) {
            const sum = watchingValues.reduce((a, b) => a + b, 0);
            watchingAverage.current = sum / watchingValues.length;
        }
    }, [watchingValues])

    useEffect(() => {
        if (notWatchingValues.length > 0) {
            const sum = notWatchingValues.reduce((a, b) => a + b, 0);
            notWatchingAverage.current = sum / notWatchingValues.length;
        }
    }, [notWatchingValues])

    const calibratingCanceled = () => {
        setIsCalibrating(false);
        context.setIsMagnitudeActive(false);
    }

    const StartCalibrating = () => {
        const startsound = new Audio("/sounds/start-next.mp3");
        const endsound = new Audio("/sounds/end.mp3");
        const errorsound = new Audio("/sounds/error.mp3");
        startsound.play();
        setIsCalibrating(true);
        setIsCalibrateWatching(false);
        setTimeout(() => {
            startsound.play();
            setIsCalibrateWatching(true);
            
        }, 10000);
        setTimeout(() => {
            
            setIsCalibrating(false);
            if (watchingAverage.current <= 1 || notWatchingAverage.current <= 1) {
                toast(`Calibration failed, please try again. Make sure you are walking while calibrating.`);
                resetCalibration();
                errorsound.play();

            }
            else {
                endsound.play();
                context.setMagnitudeThreshold((watchingAverage.current + notWatchingAverage.current) / 2);
                toast("Calibration successful, you can now close the drawer.");
            }
        }, 20000);
    }



    const resetCalibration = () => {
        setWatchingValues([]);
        setNotWatchingValues([]);
        watchingAverage.current = 0;
        notWatchingAverage.current = 0;
    }





    return <Drawer>
        <DrawerTrigger asChild>
            <Button variant="outline">Calibrate</Button>
        </DrawerTrigger>
        <DrawerContent>
            <div className="mx-auto w-full max-w-xl">
                <DrawerHeader>
                    <DrawerTitle>Calibrate Watching Detection</DrawerTitle>
                    <DrawerDescription>First, you will have to walk without watching your phone until you hear a sound. <br /> After the sound, walk until you hear the end sound while watching your phone.</DrawerDescription>
                </DrawerHeader>
                <div className="flex flex-row space-x-4 w-full" id='notwatching-card'>
                    <Card className={`flex-1 ${isCalibrateWatching || !isCalibrating ? 'bg-gray-200' :'' }`} >
                        <CardHeader>
                            <CardTitle>Not Watching Average</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{notWatchingAverage.current.toFixed(2)}</p>
                        </CardContent>
                        <CardFooter>
                            <p>Data length: {notWatchingValues.length}</p>
                        </CardFooter>
                    </Card>
                    <Card className={`flex-1 ${!isCalibrating || !isCalibrateWatching ?   'bg-gray-200' : ''}`}>
                        <CardHeader>
                            <CardTitle>Watching Average</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{watchingAverage.current.toFixed(2)}</p>
                        </CardContent>
                        <CardFooter>
                            <p>Data length: {watchingValues.length}</p>
                        </CardFooter>
                    </Card>
                </div>
                <DrawerFooter>
                    <Button onClick={() => StartCalibrating()} disabled={isCalibrating == true}>Start Calibrating</Button>
                    <Button onClick={() => resetCalibration()} disabled={isCalibrating == true}>Reset Calibration</Button>
                    <DrawerClose>
                        <Button variant="outline" onClick={() => calibratingCanceled()}>Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </div>
        </DrawerContent>

    </Drawer>

}

export default PedestrianCalibrationDrawer;