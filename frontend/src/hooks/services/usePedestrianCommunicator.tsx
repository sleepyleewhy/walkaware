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
        socket.on("presence", (data: { driver_count: number, crosswalk_id: number }) => {
          console.log("[ped_communicator] presence", data);
          if (data.crosswalk_id !== joinedCrosswalkRef.current) return;
          if (data.driver_count > 0 && alertLevelRef.current === 2) {
              setAlertLevel(3);
          }
          else if (data.driver_count === 0 && (alertLevelRef.current >= 3)) {
              setAlertLevel(2);
          }
        })
        socket.on("ped_critical", (data: { min_distance: number, crosswalk_id: number}) => {
          console.log("[ped_communicator] ped_critical received", data);
          if (data.crosswalk_id !== joinedCrosswalkRef.current) return;
            if (alertLevelRef.current === 3 || alertLevelRef.current === 2) {
                setAlertLevel(4);
                console.log("[ped_communicator] alert level raised to 4");
            }
        })
        socket.on("alert_end", (data: {crosswalk_id : number}) => {
          if (data.crosswalk_id !== joinedCrosswalkRef.current) return;
            if (alertLevelRef.current === 4) {
                setAlertLevel(3);
            }
            console.log("[ped_communicator] alert_end received");
        })

        return () => {
            socket.off("presence");
            socket.off("ped_critical");
            socket.off("alert_end");
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
