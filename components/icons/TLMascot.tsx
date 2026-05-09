// Playground mascot — the ToolsLab "beaker bot".
// Reusable at any size. `mood` swaps eyes (happy = arcs, curious = dots).

type Mood = 'happy' | 'curious';

interface TLMascotProps {
  size?: number;
  mood?: Mood;
  className?: string;
}

export function TLMascot({ size = 80, mood = 'happy', className }: TLMascotProps) {
  const gradientId = `tl-flask-${size}-${mood}`;
  return (
    <svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 80 88"
      fill="none"
      role="img"
      aria-label="ToolsLab mascot"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ec4899" stopOpacity="0.60" />
        </linearGradient>
      </defs>

      {/* flask body */}
      <path
        d="M28 8v16L12 58a8 8 0 0 0 7 12h42a8 8 0 0 0 7-12L52 24V8"
        fill={`url(#${gradientId})`}
        stroke="#1f1b2e"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M24 8h32" stroke="#1f1b2e" strokeWidth="2.4" strokeLinecap="round" />

      {/* liquid surface */}
      <path
        d="M18 48h44"
        stroke="#1f1b2e"
        strokeWidth="1.4"
        strokeDasharray="2 3"
        opacity="0.5"
      />

      {/* bot body */}
      <rect
        x="28"
        y="40"
        width="24"
        height="20"
        rx="5"
        fill="#fde68a"
        stroke="#1f1b2e"
        strokeWidth="2"
      />

      {/* eyes */}
      {mood === 'happy' ? (
        <>
          <path
            d="M33 49a2 2 0 0 0 2 2 2 2 0 0 0 2-2"
            stroke="#1f1b2e"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M43 49a2 2 0 0 0 2 2 2 2 0 0 0 2-2"
            stroke="#1f1b2e"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <circle cx="35" cy="49" r="1.7" fill="#1f1b2e" />
          <circle cx="45" cy="49" r="1.7" fill="#1f1b2e" />
        </>
      )}

      {/* mouth */}
      <path
        d="M37 55c1 1 5 1 6 0"
        stroke="#1f1b2e"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* antenna */}
      <path d="M40 40v-4" stroke="#1f1b2e" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="35" r="2.5" fill="#f472b6" stroke="#1f1b2e" strokeWidth="1.8" />

      {/* bubbles */}
      <circle cx="22" cy="64" r="2"   fill="#a78bfa" opacity="0.7" />
      <circle cx="58" cy="66" r="2.6" fill="#f472b6" opacity="0.7" />
      <circle cx="38" cy="70" r="1.4" fill="#fde68a" opacity="0.9" />
    </svg>
  );
}

export default TLMascot;
