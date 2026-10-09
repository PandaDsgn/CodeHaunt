import { BatShape, CloudShape, GhostShape } from "./haunted-icons.jsx";
import sceneImage from "../assets/images/haunted-scene.png";

// Positioned in the open black-sky areas of the scene image (avoiding the
// moon in the upper right and the house/tree silhouettes on the edges).
const GHOSTS = [
  { top: "14%", left: "18%", size: 54, color: "var(--orange)", duration: 6, delay: 0 },
  { top: "8%", left: "48%", size: 48, color: "var(--bone)", duration: 7.5, delay: 2 },
  { top: "28%", left: "62%", size: 40, color: "#9A9A9A", duration: 6.8, delay: 1.2 },
];

const BATS = [
  { top: "14%", size: 34, duration: 16, delay: 0 },
  { top: "26%", size: 26, duration: 21, delay: 5 },
  { top: "9%", size: 30, duration: 19, delay: 11 },
];

const CLOUDS = [
  { top: "4%", left: "30%", size: 110, duration: 46, delay: 6 },
  { top: "18%", left: "5%", size: 90, duration: 52, delay: 18 },
];

/** Purely decorative, kept out of the tab order and off-screen readers. */
export default function HauntedBackground() {
  return (
    <div className="haunted-bg" aria-hidden="true">
      <img src={sceneImage} alt="" className="hb-scene" />
      <div className="hb-scrim" />

      {CLOUDS.map((c, i) => (
        <span
          key={i}
          className="hb-cloud"
          style={{
            top: c.top,
            left: c.left,
            width: c.size,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          <CloudShape />
        </span>
      ))}

      {BATS.map((b, i) => (
        <span
          key={i}
          className="hb-bat"
          style={{
            top: b.top,
            width: b.size,
            height: b.size * 0.6,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <BatShape />
        </span>
      ))}

      {GHOSTS.map(({ top, left, size, color, duration, delay }, i) => (
        <span
          key={i}
          className="haunted-shape"
          style={{
            top,
            left,
            width: size,
            height: size,
            color,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
          }}
        >
          <GhostShape />
        </span>
      ))}
    </div>
  );
}
