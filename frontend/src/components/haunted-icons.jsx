// Simple flat silhouettes, no library has Halloween-specific shapes like
// these. Kept deliberately minimal (a handful of path commands each) to
// match the rest of the app's flat, geometric visual language.

export function GhostShape(props) {
  return (
    <svg viewBox="0 0 100 100" fill="none" {...props}>
      <path
        d="M50 6C27 6 12 24 12 48v42l15-13 13 13 10-9 10 9 13-13 15 13V48C88 24 73 6 50 6Z"
        fill="currentColor"
      />
      <circle cx="36" cy="46" r="6" fill="#000" />
      <circle cx="64" cy="46" r="6" fill="#000" />
    </svg>
  );
}

export function SkullShape(props) {
  return (
    <svg viewBox="0 0 100 100" fill="none" {...props}>
      <circle cx="50" cy="40" r="30" fill="currentColor" />
      <rect x="34" y="58" width="32" height="22" rx="5" fill="currentColor" />
      <circle cx="38" cy="38" r="8" fill="#000" />
      <circle cx="62" cy="38" r="8" fill="#000" />
      <path d="M46 50l4 9 4-9h-8Z" fill="#000" />
      <rect x="38" y="78" width="4" height="7" fill="#000" />
      <rect x="47" y="78" width="4" height="7" fill="#000" />
      <rect x="56" y="78" width="4" height="7" fill="#000" />
    </svg>
  );
}

export function BatShape(props) {
  return (
    <svg viewBox="0 0 100 60" fill="none" {...props}>
      <path
        d="M50 24C42 8 22 2 0 12c16 5 27 13 32 21-11-4-23-1-32 10 16-5 30-4 39 1l11 10 11-10c9-5 23-6 39-1-9-11-21-14-32-10 5-8 16-16 32-21C78 2 58 8 50 24Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MoonShape(props) {
  return (
    <svg viewBox="0 0 100 100" fill="none" {...props}>
      <circle cx="50" cy="50" r="48" fill="currentColor" />
      <circle cx="35" cy="35" r="8" fill="#000" opacity="0.08" />
      <circle cx="63" cy="54" r="12" fill="#000" opacity="0.06" />
      <circle cx="40" cy="68" r="6" fill="#000" opacity="0.07" />
    </svg>
  );
}

export function CloudShape(props) {
  return (
    <svg viewBox="0 0 160 60" fill="none" {...props}>
      <path
        d="M20 50a18 18 0 0 1 2-36 22 22 0 0 1 42-7 20 20 0 0 1 29 9 16 16 0 0 1 5 34Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function JackOLanternShape(props) {
  return (
    <svg viewBox="0 0 100 80" fill="none" {...props}>
      <path d="M8 2 L20 10 M92 2 L80 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="50" cy="45" rx="42" ry="32" fill="currentColor" />
      <path d="M8 45 Q50 30 92 45" stroke="#000" strokeOpacity="0.25" strokeWidth="3" fill="none" />
      <path d="M50 13 Q45 45 50 77 M50 13 Q55 45 50 77" stroke="#000" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <path d="M26 35 L38 45 L26 51Z M74 35 L62 45 L74 51Z" fill="#000" />
      <path d="M26 60 L35 54 L44 60 L50 55 L56 60 L65 54 L74 60 L62 64 L50 59 L38 64Z" fill="#000" />
    </svg>
  );
}

/** Jagged mountain range horizon. Sharper peaks than a rolling-hill line, to
 * fit a Transylvania-castle-on-a-cliff silhouette on top of it. */
export function MountainShape(props) {
  return (
    <svg viewBox="0 0 1200 300" preserveAspectRatio="none" fill="none" {...props}>
      <path
        d="M0 300 L0 190 L150 70 L280 170 L420 50 L560 180 L700 100 L850 210 L1000 80 L1150 200 L1200 160 L1200 300Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Three-tower Transylvania-style castle: a tall center keep flanked by two
 * shorter towers, conical roofs, crenellated connecting walls, a couple of
 * glowing windows (own classNames so CSS can flicker just those). */
export function CastleShape(props) {
  return (
    <svg viewBox="0 0 200 170" fill="none" {...props}>
      <g fill="currentColor">
        <rect x="10" y="80" width="30" height="80" />
        <path d="M10 80 L25 50 L40 80Z" />

        <rect x="75" y="40" width="50" height="120" />
        <path d="M75 40 L100 0 L125 40Z" />

        <rect x="160" y="70" width="30" height="90" />
        <path d="M160 70 L175 42 L190 70Z" />

        <rect x="40" y="118" width="35" height="42" />
        <rect x="125" y="108" width="35" height="52" />

        <rect x="40" y="113" width="8" height="8" />
        <rect x="55" y="113" width="8" height="8" />
        <rect x="68" y="113" width="8" height="8" />
        <rect x="128" y="103" width="8" height="8" />
        <rect x="142" y="103" width="8" height="8" />
        <rect x="155" y="103" width="8" height="8" />
      </g>
      <rect className="hb-window" x="95" y="78" width="10" height="16" fill="var(--orange)" />
      <rect className="hb-window hb-window-2" x="20" y="98" width="8" height="12" fill="var(--orange)" />
    </svg>
  );
}
