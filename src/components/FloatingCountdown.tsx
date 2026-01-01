import { useState, useEffect } from "react";
import { getWeddingDate } from "../utils/urlParams";

const FloatingCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const wedding = getWeddingDate();
      const now = new Date();
      const difference = wedding.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="">
      <div className="bg-white backdrop-blur-sm rounded-md shadow-xl border border-primary-100 p-4 min-w-[200px]">
        <div className="text-center">
          <h3 className="text-sm font-medium text-black mb-2">
            The Countdown Begins... ⏳
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-black text-white rounded-md p-2">
              <div className="text-lg font-bold">{timeLeft.days}</div>
              <div className="text-xs">Days</div>
            </div>
            <div className="bg-black text-white rounded-md p-2">
              <div className="text-lg font-bold">{timeLeft.hours}</div>
              <div className="text-xs">Hours</div>
            </div>
            <div className="bg-black text-white rounded-md p-2">
              <div className="text-lg font-bold">{timeLeft.minutes}</div>
              <div className="text-xs">Min</div>
            </div>
            <div className="bg-black text-white rounded-md p-2">
              <div className="text-lg font-bold">{timeLeft.seconds}</div>
              <div className="text-xs">Sec</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingCountdown;
