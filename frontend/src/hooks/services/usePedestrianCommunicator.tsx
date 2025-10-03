import { useEffect, useRef, useCallback, Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";

const usePedestrianCommunicator = (
  crosswalkId: number | null | undefined,
  socket: Socket,
  alertLevel: number,
  setAlertLevel: Dispatch<SetStateAction<number>>
) => {
  const joinedCrosswalkRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);

  const leaveIfJoined = useCallback(
    (reason?: string) => {
      if (joinedCrosswalkRef.current != null) {
        const cw = joinedCrosswalkRef.current;
        // send leave
        socket.emit("ped_leave", { crosswalk_id: cw });
        console.log(
          "[ped_communicator] ped_leave",
          { crosswalk_id: cw },
          reason ? `reason=${reason}` : ""
        );
        joinedCrosswalkRef.current = null;
      }
    },
    [socket]
  );

  const handlePedCritical = useCallback(
    (payload: { crosswalk_id: number; min_distance: number; ts: number }) => {
      console.log("[ped_communicator] ped_critical received", payload);
      setAlertLevel((prev) => (prev < 4 ? 4 : prev));
    },
    [setAlertLevel]
  );

  // Manage listener (only ped_critical)
  useEffect(() => {
    if (!isListeningRef.current) {
      socket.off("ped_critical"); // safety
      socket.on("ped_critical", handlePedCritical);
      isListeningRef.current = true;

      console.log("[ped_communicator] listening to ped_critical");
    }
    return () => {
      socket.off("ped_critical", handlePedCritical);
      isListeningRef.current = false;
    };
  }, [socket, handlePedCritical]);

  // Core enter/leave logic bound to alertLevel and crosswalkId
  useEffect(() => {
    const canParticipate = alertLevel >= 3 && !!crosswalkId;

    if (!canParticipate) {
      // condition no longer satisfied
      leaveIfJoined("alertLevel_or_crosswalk_inactive");
      return;
    }

    // If switching crosswalks
    if (
      joinedCrosswalkRef.current != null &&
      joinedCrosswalkRef.current !== crosswalkId
    ) {
      leaveIfJoined("crosswalk_changed");
    }

    // Enter if not already
    if (joinedCrosswalkRef.current == null && crosswalkId) {
      socket.emit("ped_enter", { crosswalk_id: crosswalkId });
      joinedCrosswalkRef.current = crosswalkId;
      console.log("[ped_communicator] ped_enter", { crosswalk_id: crosswalkId });
    }
  }, [alertLevel, crosswalkId, socket, leaveIfJoined]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveIfJoined("unmount");
    };
  }, [leaveIfJoined]);
};

export default usePedestrianCommunicator;
