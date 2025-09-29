import React, { useEffect, useState } from "react";

type AnalogClockProps = {
  size?: number; // pixels
};

const AnalogClock: React.FC<AnalogClockProps> = ({ size = 80 }) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const secondDeg = seconds * 6; // 360/60
  const minuteDeg = minutes * 6 + seconds * 0.1; // smooth
  const hourDeg = hours * 30 + minutes * 0.5; // 360/12 + minute offset

  const wrapperStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div className="ad-analog-clock" style={wrapperStyle} aria-hidden>
      <div className="ad-clock-face">
        <div
          className="ad-clock-hand hour"
          style={{ transform: `translate(-50%, -100%) rotate(${hourDeg}deg)` }}
        />
        <div
          className="ad-clock-hand minute"
          style={{ transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)` }}
        />
        <div
          className="ad-clock-hand second"
          style={{ transform: `translate(-50%, -100%) rotate(${secondDeg}deg)` }}
        />

        <div className="ad-clock-tick ad-tick-12" />
        <div className="ad-clock-center" />
      </div>
    </div>
  );
};

export default AnalogClock;
