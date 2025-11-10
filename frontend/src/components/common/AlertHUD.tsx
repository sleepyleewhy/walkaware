import React, { useEffect, useMemo, useRef } from "react";

type AlertHUDProps = {
  level: number; // -1 off, 0 idle, 1 detect, 2 approaching, 3 caution, 4 critical
  role?: "driver" | "pedestrian";
  enableSound?: boolean;
  enableVibration?: boolean;
};

const useAudio = (src: string) => {
  const ref = useRef<HTMLAudioElement | null>(null);
  if (!ref.current) {
    const audio = new Audio(src);
    audio.preload = "auto";
    ref.current = audio;
  }
  return ref;
};

const AlertHUD: React.FC<AlertHUDProps> = ({ level, role, enableSound = true, enableVibration = true }) => {
  const lastLevelRef = useRef<number>(level);

  const startTone = useAudio("/sounds/start-next.mp3");
  const criticalTone = useAudio("/sounds/error.mp3");
  const clearTone = useAudio("/sounds/end.mp3");

  const { visible, variant, title, subtitle, classes } = useMemo(() => {
    const common = {
      title: "",
      subtitle: "",
      variant: "idle" as "idle" | "info" | "warn" | "critical",
      classes: "",
      visible: false,
    };

    if (level < 2) return { ...common };

    if (level === 2) {
      if (role === "driver") {
        return { ...common };
      }
      return {
        visible: true,
        variant: "info" as const,
        title: "Standing on a crosswalk",
        subtitle:  "Watch for vehicles!",
        classes: "bg-yellow-500/95 text-black",
      };
    }

    if (level === 3) {
    if (role === "driver") {
      return {
        visible: true,
        variant: "info" as const,
        title: "Caution",
        subtitle: "Unaware pedestrian on crosswalk",
        classes: "bg-blue-600/95 text-white",
      };
    }
    return {
      visible: true,
      variant: "warn" as const,
      title: "Caution",
      subtitle: "Vehicle nearby",
      classes: "bg-orange-600/95 text-white animate-pulse",
    };
    }

    // level >= 4
    return {
      visible: true,
      variant: "critical" as const,
      title: role === "driver" ? "STOP NOW" : "DON'T CROSS",
      subtitle: role === "driver" ? "Immediate danger at crosswalk" : "Immediate danger at crosswalk",
      classes: "bg-red-600/95 text-white",
    };
  }, [level, role]);

  // Effects on level changes: sound + vibration patterns
  useEffect(() => {
    const prev = lastLevelRef.current;
    if (prev === level) return;

    const vibrate = (pattern: number[] | number) => {
      if (!enableVibration) return;
      if (navigator.vibrate) {
        try { navigator.vibrate(pattern); } catch { /* ignore */ }
      }
    };

    if (level >= 4 && prev < 4) {
      // escalate to critical
      if (enableSound) { criticalTone.current?.play().catch(() => {}); }
      vibrate([600, 200, 600, 200, 600]);
    } else if (level === 3 && prev < 3) {
      if (enableSound) { startTone.current?.play().catch(() => {}); }
      vibrate([300, 150, 300]);
    } else if (level <= 2 && prev > 2) {
      if (enableSound) { clearTone.current?.play().catch(() => {}); }
      vibrate(0);
    }

    lastLevelRef.current = level;
  }, [level, enableSound, enableVibration, criticalTone, startTone, clearTone]);

  if (!visible) return null;

  const isCritical = variant === "critical";

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Banner for level 2/3, full overlay for 4 */}
      {isCritical ? (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          <div className={`m-0 w-screen h-screen flex flex-col items-center justify-center ${classes}`}>
            <div className="text-6xl sm:text-7xl font-extrabold tracking-tight drop-shadow-lg">
              {title}
            </div>
            <div className="mt-4 text-xl sm:text-2xl opacity-90 font-semibold">
              {subtitle}
            </div>
          </div>
        </div>
      ) : (
        <div className={`pointer-events-none mt-2 rounded-xl px-6 py-3 shadow-2xl border-2 border-black/10 ${classes}`}>
          <div className="text-2xl sm:text-3xl font-extrabold">{title}</div>
          <div className="text-sm sm:text-base opacity-90 font-medium">{subtitle}</div>
        </div>
      )}
    </div>
  );
};

export default AlertHUD;
