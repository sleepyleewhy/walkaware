import { useEffect,  useRef, useState } from "react"


interface IAccelerometer {
    isCurrWatching: boolean;
    setIsCurrWatching: (isWatching: boolean) => void;
}


const Accelerometer: React.FC<IAccelerometer> = ({isCurrWatching, setIsCurrWatching}) => {

    const lastProcessed = useRef(Date.now()) 

    const [magnitude, setMagnitude] = useState(0)


    const [calibrateWatchingData, setCalibrateWatchingData] = useState<number[]>([])
    const [calibrateWatchingAverage, setCalibrateWatchingAverage] = useState(0);

    const [calibrateNotWatchingData, setCalibrateNotWatchingData] = useState<number[]>([])
    const [calibrateNotWatchingAverage, setCalibrateNotWatchingAverage] = useState(0);

    const [isCalibrating, setIsCalibrating] = useState(false)
    const [isCalibrateWatching, setIsCalibrateWatching] = useState(false)


    const border = useRef(0)

    const [isRunning, setIsRunning] = useState(false)


    // Initializing the accelerometer event subscription
    useEffect(() => {
        const handleMotionEvent = (event: DeviceMotionEvent) => {
            const now = Date.now()
    
            if (now - lastProcessed.current < 200) {
                return
            }
            else {
                lastProcessed.current = now;
                if (event.acceleration) {
                    setMagnitude(CalculateMagnitude(event.acceleration.x ?? 0, event.acceleration.y ?? 0, event.acceleration.z ?? 0))
                }
            }
        }
        window.addEventListener('devicemotion', handleMotionEvent)


        return () => {
            window.removeEventListener('devicemotion', handleMotionEvent)
        }
    }, [])

    
    const CalculateMagnitude = (x: number, y: number, z: number) : number => {
        return Math.sqrt(x*x + y*y + z*z);
    }

    // if in Calibration mode, set calibration data, if running mode, check if the magnitude is above the border
    useEffect(() => {
            if (isCalibrating) {
                if (isCalibrateWatching) {
                    setCalibrateWatchingData(w => [...w, magnitude])
                }
                else {
                    setCalibrateNotWatchingData(w => [...w, magnitude])
                }
            }
            else if (isRunning) {
                if (border.current !== 0) {
                    if (magnitude < border.current) {
                        setIsCurrWatching(true)
                    }
                    else {
                        setIsCurrWatching(false)
                    }
                }
            }

    }, [magnitude, isCalibrating, isCalibrateWatching, isRunning, setIsCurrWatching])


    const CalibrateWatchingDetection = () => {
        const startSound = new Audio('../assets/sounds/start-next.mp3');
        const endSound = new Audio('../assets/sounds/end.mp3');
        startSound.play()
        setIsCalibrating(true)
        setIsCalibrateWatching(false)
        setTimeout(() => {
            startSound.play()
            setIsCalibrateWatching(true)
        }, 10000)
        setTimeout(() => {
            endSound.play()
            setIsCalibrating(false)

        }, 20000)
    }

    useEffect(() => {
        if (calibrateWatchingData.length > 0) {
            setCalibrateWatchingAverage(calibrateWatchingData.reduce((acc, curr) => acc + curr, 0) / calibrateWatchingData.length);    
        }
        if (calibrateNotWatchingData.length > 0){
            setCalibrateNotWatchingAverage(calibrateNotWatchingData.reduce((acc, curr) => acc + curr, 0) / calibrateNotWatchingData.length) 
        }
    }, [calibrateWatchingData, calibrateNotWatchingData] )

    useEffect(() => {
        border.current = (calibrateWatchingAverage+ calibrateNotWatchingAverage) / 2
    }, [calibrateWatchingAverage, calibrateNotWatchingAverage])
        


    return <>
        <div>
            <button onClick={CalibrateWatchingDetection} disabled={isCalibrating}>Calibrate</button>
            <p>Calibration: First, walk without watching the screen until the sound (10 seconds), then walk while watching the screen until the end sound.</p>
            <p>Watching magnitude data length: {calibrateWatchingData.length}</p>
            <p>Average magnitude while watching: {calibrateWatchingAverage}</p> 
            <p>Not watching magnitude data length: {calibrateNotWatchingData.length}</p>    
            <p>Average magnitude while not watching: {calibrateNotWatchingAverage}</p>
        </div>    
        


        <button onClick={() => setIsRunning(!isRunning)} disabled={border.current ! == 0}>{isRunning ? 'Stop' : 'Start'}</button>
        <button onClick={() => setIsCurrWatching(!isCurrWatching)}>Toggle watching (test purposes)</button>
        <p>Border: {border.current.toString()}</p>
        <p>Currently: {isCurrWatching ? 'watching' : 'not watching'}</p>
        <p>Current magnitude: {magnitude}</p>


    </>
}

export default Accelerometer