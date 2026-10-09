import { useEffect, useState } from "react";
import { Ghost } from "@phosphor-icons/react";
import { api } from "../api/client.js";
import { enterFullscreen, isFullscreen } from "../fullscreen.js";
import { formatRemaining } from "../formatRemaining.js";
import HauntedBackground from "./HauntedBackground.jsx";
import disqualifiedGif from "../assets/gif/disqualified.gif";

/** Gates the whole app for participants: blocks access until the organizer's
 * event start time arrives, then enforces fullscreen for the rest of the
 * contest. Dropping out of fullscreen after the event has started is an
 * instant, permanent disqualification (score frozen at whatever it already
 * was) — not just a nudge, unlike the countdown phase below. */
export default function ParticipantGate({ children }) {
  const [me, setMe] = useState(null);
  const [startsAt, setStartsAt] = useState(undefined); // undefined = loading, null = not scheduled
  const [now, setNow] = useState(Date.now());
  const [fs, setFs] = useState(isFullscreen());
  const [finalScore, setFinalScore] = useState(null);

  useEffect(() => {
    api.me().then(setMe).catch(() => {});
    api
      .getEvent()
      .then((e) => setStartsAt(e.starts_at))
      .catch(() => setStartsAt(null));
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    function handleChange() {
      setFs(isFullscreen());
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const eventStarted = Boolean(startsAt) && new Date(startsAt).getTime() <= now;

  useEffect(() => {
    if (!me || me.disqualified_at || !eventStarted || fs) return;
    api.disqualify().then((updated) => {
      setMe(updated);
      api
        .leaderboard()
        .then((rows) => {
          const mine = rows.find((r) => r.user_id === updated.id);
          setFinalScore(mine ? mine.total_score : 0);
        })
        .catch(() => setFinalScore(0));
    });
  }, [me, eventStarted, fs]);

  if (!me || startsAt === undefined) {
    return <p className="page loading-text">Loading</p>;
  }

  if (me.disqualified_at) {
    return (
      <div className="fullscreen-lock">
        <HauntedBackground />
        <img src={disqualifiedGif} alt="" className="disqualified-gif" />
        <p>Contest ended for you. Fullscreen was exited.</p>
        {finalScore !== null && <p className="fullscreen-lock-score">Final score: {finalScore}</p>}
      </div>
    );
  }

  if (!eventStarted) {
    return (
      <div className="fullscreen-lock">
        <HauntedBackground />
        <Ghost size={48} weight="fill" className="contest-timer-ghost" />
        {startsAt ? (
          <>
            <p>The contest hasn't started yet.</p>
            <p className="fullscreen-lock-score">{formatRemaining(new Date(startsAt).getTime() - now)}</p>
          </>
        ) : (
          <p>Waiting for the organizer to schedule the start time.</p>
        )}
        {!fs && (
          <button type="button" onClick={enterFullscreen}>
            Enter fullscreen now, you'll need it once we start
          </button>
        )}
      </div>
    );
  }

  if (!fs) {
    return <p className="page loading-text">Ending contest</p>;
  }

  return children;
}
