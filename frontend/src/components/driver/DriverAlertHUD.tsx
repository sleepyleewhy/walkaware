import React from "react";
import { useDriverContext } from "@/context/driverContext";
import AlertHUD from "@/components/common/AlertHUD";

const DriverAlertHUD: React.FC = () => {
  const { alertLevel } = useDriverContext();
  return <AlertHUD level={alertLevel} role="driver" />;
};

export default DriverAlertHUD;
