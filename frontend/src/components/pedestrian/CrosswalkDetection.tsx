import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface ICrosswalkDetection {
  isWatching : boolean;
  socket: Socket
}

const CrosswalkDetection :React.FC<ICrosswalkDetection> = ({isWatching, socket}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);

  const predictIntervalRef = useRef<number | null>(null);

  const [isCrosswalk, setIsCrosswalk] = useState(false);



  useEffect(() => { 
    // socket.io connection
    socket.on("connect_error", (err) => { 
        console.log(`connect_error due to ${err}`);
      });
    socket.on('connect', () => {
        console.log('Connected to server');
      });
  
      socket.on('predict_result', (data) => {
        if (data === true) {
          setIsCrosswalk(true);
        }
        else {
          setIsCrosswalk(false);
        }
      });


    const setupCamera = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 640 }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = videoRef.current;
        
        if (!video) return;

        video.srcObject = stream;
        await video.play();
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    };

    const processFrame = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) return;
  
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      ctx.drawImage(video, 0, 0, 640, 640);
      
    };

    intervalRef.current = window.setInterval(processFrame, 1000 / 5);

    

    setupCamera();

    // Cleanup
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      socket.disconnect();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket]);


 

  useEffect(() => {

    const predict = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const base64 = canvas.toDataURL('image/jpeg', 0.5);
      await socket.emit('predict', base64);
    }
    if (isWatching) {
      predictIntervalRef.current = window.setInterval(predict, 1000/ 15);
    }
    else {
      if (predictIntervalRef.current) clearInterval(predictIntervalRef.current);
    }
  }, [isWatching, socket]);

  return (
    <><div>
      <h1>{isWatching ? isCrosswalk ? 'Crosswalk detected' : 'No crosswalk' : 'not watching'}</h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
      
      <canvas
        ref={canvasRef}
        width="640"
        height="640"
      />
    </div></>
    
  );
};

export default CrosswalkDetection;