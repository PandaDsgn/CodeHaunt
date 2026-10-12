import { useCallback, useEffect, useRef, useState } from "react";
import { Ghost } from "@phosphor-icons/react";
import { api } from "../api/client.js";
import { enterFullscreen, isFullscreen } from "../fullscreen.js";
import { formatRemaining } from "../formatRemaining.js";
import disqualifiedGif from "../assets/gif/disqualified.gif";

/** Gates the whole app for participants: blocks access until the organizer's
 * event start time arrives, then enforces fullscreen for the rest of the
 * contest. Once the event has started, dropping out of fullscreen, switching
 * tabs/windows, or logging out are each an instant, permanent
 * disqualification (score frozen at whatever it already was) — not just a
 * nudge, unlike the countdown phase below. */
export default function ParticipantGate({ children }) {
  const [me, setMe] = useState(null);
  const [startsAt, setStartsAt] = useState(undefined); // undefined = loading, null = not scheduled
  const [now, setNow] = useState(Date.now());
  const [fs, setFs] = useState(isFullscreen());
  const [finalScore, setFinalScore] = useState(null);
  const [reason, setReason] = useState(null);
  const disqualifying = useRef(false);
  const wasDisqualified = useRef(false);
  const [reinstated, setReinstated] = useState(false);

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

  const disqualify = useCallback(async (why) => {
    if (disqualifying.current) return;
    disqualifying.current = true;
    setReason(why);
    try {
      setMe(await api.disqualify());
    } catch {
      disqualifying.current = false;
    }
  }, []);

  // Pick up organizer actions (disqualify / reinstate) without a page reload.
  useEffect(() => {
    const poll = setInterval(() => {
      api.me().then(setMe).catch(() => {});
    }, 5000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (!me) return;
    const dq = Boolean(me.disqualified_at);
    if (dq && !wasDisqualified.current) {
      setReason((r) => r ?? "An organizer disqualified you.");
    } else if (!dq && wasDisqualified.current) {
      // Reinstated: re-arm the self-disqualify guard and make them re-enter
      // fullscreen with a click instead of being disqualified again at once.
      disqualifying.current = false;
      setReason(null);
      setFinalScore(null);
      setReinstated(true);
    }
    wasDisqualified.current = dq;
  }, [me]);

  useEffect(() => {
    if (reinstated && fs) setReinstated(false);
  }, [reinstated, fs]);

  const active = Boolean(me) && !me.disqualified_at && eventStarted && !reinstated;

  useEffect(() => {
    if (active && !fs) disqualify("Fullscreen was exited.");
  }, [active, fs, disqualify]);

  // Switching tabs or windows: the page goes hidden, or the window loses focus.
  useEffect(() => {
    if (!active) return;
    const onVisibility = () => {
      if (document.hidden) disqualify("You switched tabs or windows.");
    };
    const onBlur = () => disqualify("You switched tabs or windows.");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [active, disqualify]);

  // Show the frozen score on the disqualified screen, including after a re-login.
  const disqualifiedAt = me?.disqualified_at;
  useEffect(() => {
    if (!disqualifiedAt) return;
    api
      .leaderboard()
      .then((rows) => {
        const mine = rows.find((r) => r.user_id === me.id);
        setFinalScore(mine ? mine.total_score : 0);
      })
      .catch(() => setFinalScore(0));
  }, [disqualifiedAt, me?.id]);

  if (!me || startsAt === undefined) {
    return <p className="page loading-text">Loading</p>;
  }

  if (me.disqualified_at) {
    return (
      <div className="fullscreen-lock">
        <img src={disqualifiedGif} alt="" className="disqualified-gif" />
        <div className="panel dq-message">
          <p>Contest ended for you. {reason ?? "You broke the contest rules."}</p>
          {finalScore !== null && <p className="fullscreen-lock-score">Final score: {finalScore}</p>}
        </div>
      </div>
    );
  }

  if (reinstated) {
    return (
      <div className="fullscreen-lock">
        <div className="panel dq-message">
          <p>An organizer reinstated you. Re-enter fullscreen to continue the contest.</p>
          <button type="button" onClick={enterFullscreen}>
            Enter fullscreen
          </button>
        </div>
      </div>
    );
  }

  if (!eventStarted) {
    const remainingMs = startsAt ? new Date(startsAt).getTime() - now : 0;
    return (
      <div className={`fullscreen-lock horror-lock${remainingMs <= 10000 ? " is-urgent" : ""}`}>
        <Ghost size={48} weight="fill" className="contest-timer-ghost" />
        {startsAt ? (
          <>
            <p className="horror-kicker">The contest hasn't started yet.</p>
            <div className="horror-clock" role="timer" aria-label={formatRemaining(remainingMs)}>
              {[...formatRemaining(remainingMs)].map((ch, i, all) =>
                /\d/.test(ch) ? (
                  // Re-keyed on the value so the tick animation replays on every change.
                  <span key={`${i}-${ch}`} className="hc-digit" style={{ "--i": i }}>
                    {ch}
                  </span>
                ) : (
                  <span key={`${all.length}-${i}`} className="hc-sep">
                    {ch}
                  </span>
                )
              )}
            </div>
            <p className="horror-sub">Something is waiting. Stay in fullscreen.</p>
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
