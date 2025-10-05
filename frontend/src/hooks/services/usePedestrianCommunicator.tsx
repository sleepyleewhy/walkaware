import { Dispatch, useEffect, useRef} from "react";
import { Socket } from "socket.io-client";

const usePedestrianCommunicator = (
  crosswalkId: number | null | undefined,
  socket: Socket,
  alertLevel: number,
  setAlertLevel: Dispatch<React.SetStateAction<number>>
) => {
  const joinedCrosswalkRef = useRef<number | null>(null);

      const alertLevelRef = useRef(alertLevel);

    useEffect(() => {
        alertLevelRef.current = alertLevel;
    }, [alertLevel]);

    useEffect(() => {
        const handlePresence = (data: { driver_count: number, crosswalk_id: number }) => {
          console.log("[ped_communicator] presence", data);
          if (data.crosswalk_id !== joinedCrosswalkRef.current) return;
          if (data.driver_count > 0 && alertLevelRef.current === 2) {
              setAlertLevel(3);
          }
          else if (data.driver_count === 0 && (alertLevelRef.current >= 3)) {
              setAlertLevel(2);
          }
        };
        const handlePedCritical = (data: { min_distance: number, crosswalk_id: number}) => {
          console.log("[ped_communicator] ped_critical received", data);
          if (data.crosswalk_id !== joinedCrosswalkRef.current) return;
            if (alertLevelRef.current === 3 || alertLevelRef.current === 2) {
                setAlertLevel(4);
                console.log("[ped_communicator] alert level raised to 4");
            }
        };
        const handleAlertEnd = (data: {crosswalk_id : number}) => {
          if (data.crosswalk_id !== joinedCrosswalkRef.current) return;
            if (alertLevelRef.current === 4) {
                setAlertLevel(3);
            }
            console.log("[ped_communicator] alert_end received");
        };

        socket.on("presence", handlePresence);
        socket.on("ped_critical", handlePedCritical);
        socket.on("alert_end", handleAlertEnd);

        return () => {
            socket.off("presence", handlePresence);
            socket.off("ped_critical", handlePedCritical);
            socket.off("alert_end", handleAlertEnd);
        }
    }, [socket, setAlertLevel])


  useEffect(() => {
    const active = alertLevel >= 2;
    const hasValidCrosswalk = !!crosswalkId && crosswalkId > 0;

    if (!active || !hasValidCrosswalk) {
      if (joinedCrosswalkRef.current !== null) {
        socket.emit("ped_leave", { crosswalk_id: joinedCrosswalkRef.current });
        joinedCrosswalkRef.current = null;
      }
      return;
    }

    if (joinedCrosswalkRef.current === crosswalkId) return;

    if (joinedCrosswalkRef.current !== null) {
      socket.emit("ped_leave", { crosswalk_id: joinedCrosswalkRef.current });
    }

    socket.emit("ped_enter", { crosswalk_id: crosswalkId });
    console.log("Emitted ped_enter for crosswalk", crosswalkId);
    joinedCrosswalkRef.current = crosswalkId || null;
  }, [alertLevel, crosswalkId, socket]);

  useEffect(() => {
    return () => {
      if (joinedCrosswalkRef.current !== null) {
        socket.emit("ped_leave", { crosswalk_id: joinedCrosswalkRef.current });
        joinedCrosswalkRef.current = null;
      }
    };
  }, [socket]);
};

export default usePedestrianCommunicator;
