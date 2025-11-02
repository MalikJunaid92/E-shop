import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { server } from "../../server";

const CountDown = ({ data }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const hasDeleted = useRef(false);

  const seller = useSelector((state) => state.seller && state.seller.seller);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Only attempt deletion when the countdown reaches zero AND a seller is logged in.
    // Additionally, only run automatic deletes during local development (when the
    // frontend is served from localhost). The deployed frontend (Vercel) should
    // not attempt to call localhost:5000 in users' browsers.
    const isLocalFrontend =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (
      !hasDeleted.current &&
      Object.keys(timeLeft).length === 0 &&
      seller &&
      isLocalFrontend
    ) {
      hasDeleted.current = true;
      axios
        .delete(`${server}/event/delete-shop-event/${data._id}`, {
          withCredentials: true,
        })
        .then(() => console.log("Event deleted successfully"))
        .catch((err) => console.error("Delete failed:", err.response?.data));
    }

    return () => clearTimeout(timer);
  }, [timeLeft, seller]);

  function calculateTimeLeft() {
    const difference = +new Date(data.Finish_Date) - +new Date();
    if (difference <= 0) return {}; // ✅ simpler
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return (
    <div className="text-[25px] text-[#475ad2]">
      {Object.keys(timeLeft).length ? (
        <>
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
          {timeLeft.seconds}s
        </>
      ) : (
        <span className="text-red-500">Time's Up</span>
      )}
    </div>
  );
};

export default CountDown;
