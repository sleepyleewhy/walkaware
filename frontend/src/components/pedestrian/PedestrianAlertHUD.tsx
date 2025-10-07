import React from "react";
import { usePedestrianContext } from "@/context/pedestrianContext";
import AlertHUD from "@/components/common/AlertHUD";

const PedestrianAlertHUD: React.FC = () => {
  const { alertLevel } = usePedestrianContext();
  return <AlertHUD level={alertLevel} role="pedestrian" />;
};

export default PedestrianAlertHUD;
