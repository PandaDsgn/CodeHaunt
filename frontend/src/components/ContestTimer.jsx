import { useEffect, useState } from "react";
import { Ghost } from "@phosphor-icons/react";
import { formatRemaining } from "../formatRemaining.js";

/** endsAt: ISO datetime string, or falsy if this question has no deadline. */
export default function ContestTimer({ endsAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  if (!endsAt) return null;

  const remaining = new Date(endsAt).getTime() - now;
  const isOver = remaining <= 0;
  const isUrgent = !isOver && remaining < 5 * 60 * 1000;

  return (
    <div className={`contest-timer${isUrgent ? " contest-timer-urgent" : ""}`}>
      <Ghost size={24} weight="fill" className="contest-timer-ghost" />
      <span className="contest-timer-clock">{isOver ? "Time's up" : formatRemaining(remaining)}</span>
    </div>
  );
}
