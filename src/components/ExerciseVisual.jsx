import React from 'react';

// Consistent minimalist SVG exercise illustrations.
// Body-position focused, single visual language. Easy to replace later.
// Static line art uses a neutral charcoal tone so it stays distinct from the
// interactive accent color (which is reserved for primary actions / states).

const STROKE = 3.2;

function Figure({ children, color }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ color: color || 'hsl(var(--muted-foreground))' }}>
      <g stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

// head circle helper
const Head = ({ cx, cy, r = 7 }) => <circle cx={cx} cy={cy} r={r} />;

const POSES = {
  handstand: (c) => (
    <>
      <Head cx={100} cy={36} />
      <path d="M100 43 L100 96" />
      <path d="M100 96 L78 150 M100 96 L122 150" />
      <path d="M100 60 L74 40 M100 60 L126 40" />
      <path d="M74 40 L62 30 M126 40 L138 30" opacity="0.55" />
      <path d="M78 150 L70 162 M122 150 L130 162" opacity="0.55" />
    </>
  ),
  planche: (c) => (
    <>
      <Head cx={70} cy={120} r={7} />
      <path d="M77 120 L150 96" />
      <path d="M100 110 L100 150" />
      <path d="M100 110 L132 110" opacity="0.6" />
      <path d="M150 96 L150 150" />
      <path d="M150 150 L150 150" />
      <path d="M150 96 L168 84" opacity="0.5" />
      <path d="M150 150 L150 150" />
    </>
  ),
  hspu: (c) => (
    <>
      <Head cx={100} cy={58} />
      <path d="M100 65 L100 104" />
      <path d="M100 104 L82 142 M100 104 L118 142" />
      <path d="M100 80 L78 100 M100 80 L122 100" />
      <path d="M78 100 L70 112 M122 100 L130 112" opacity="0.55" />
    </>
  ),
  pushup: (c) => (
    <>
      <Head cx={56} cy={120} />
      <path d="M63 120 L150 112" />
      <path d="M70 116 L70 150 M140 108 L140 150" opacity="0.6" />
      <path d="M56 127 L40 132" />
      <path d="M150 112 L168 104" opacity="0.55" />
      <path d="M150 112 L150 150" opacity="0.4" />
    </>
  ),
  ringpushup: (c) => (
    <>
      <Head cx={56} cy={116} />
      <path d="M63 116 L150 108" />
      <path d="M70 112 L70 150 M140 104 L140 150" opacity="0.6" />
      <path d="M56 123 L40 128" />
      <path d="M150 108 L168 100" opacity="0.55" />
      <circle cx={70} cy={150} r={5} opacity={0.5} />
      <circle cx={140} cy={150} r={5} opacity={0.5} />
    </>
  ),
  pppu: (c) => (
    <>
      <Head cx={120} cy={120} />
      <path d="M113 120 L40 104" />
      <path d="M110 116 L110 150 M50 108 L50 150" opacity="0.6" />
      <path d="M120 127 L136 132" />
      <path d="M40 104 L24 96" opacity="0.55" />
    </>
  ),
  dip: (c) => (
    <>
      <Head cx={100} cy={56} />
      <path d="M100 63 L100 100" />
      <path d="M100 100 L78 140 M100 100 L122 140" />
      <path d="M100 80 L74 96 M100 80 L126 96" />
      <path d="M74 96 L66 120 M126 96 L134 120" opacity="0.55" />
      <circle cx={66} cy={150} r={5} opacity={0.45} />
      <circle cx={134} cy={150} r={5} opacity={0.45} />
    </>
  ),
  frontlever: (c) => (
    <>
      <Head cx={150} cy={96} />
      <path d="M143 96 L70 96" />
      <path d="M100 96 L100 60" />
      <path d="M70 96 L52 96" opacity="0.55" />
      <path d="M150 96 L150 150" opacity="0.4" />
      <path d="M70 96 L70 150" opacity="0.4" />
    </>
  ),
  flrow: (c) => (
    <>
      <Head cx={150} cy={104} />
      <path d="M143 104 L70 104" />
      <path d="M100 104 L100 64" />
      <path d="M100 84 L74 70 M100 84 L126 70" opacity="0.6" />
      <path d="M70 104 L52 104" opacity="0.55" />
      <path d="M150 104 L150 150" opacity="0.4" />
      <path d="M70 104 L70 150" opacity="0.4" />
    </>
  ),
  muscleup: (c) => (
    <>
      <Head cx={100} cy={70} />
      <path d="M100 77 L100 110" />
      <path d="M100 110 L84 150 M100 110 L116 150" />
      <path d="M100 90 L74 78 M100 90 L126 78" />
      <path d="M74 78 L62 64 M126 78 L138 64" opacity="0.55" />
      <circle cx={62} cy={56} r={5} opacity={0.45} />
      <circle cx={138} cy={56} r={5} opacity={0.45} />
    </>
  ),
  ringrow: (c) => (
    <>
      <Head cx={150} cy={112} />
      <path d="M143 112 L70 112" />
      <path d="M100 112 L100 70" />
      <path d="M100 92 L78 80 M100 92 L122 80" opacity="0.6" />
      <path d="M70 112 L52 112" opacity="0.55" />
      <path d="M150 112 L150 150 M70 112 L70 150" opacity="0.4" />
      <circle cx={52} cy={112} r={5} opacity={0.45} />
    </>
  ),
  reardeltfly: (c) => (
    <>
      <Head cx={100} cy={70} />
      <path d="M100 77 L100 130" />
      <path d="M100 95 L60 110 M100 95 L140 110" />
      <path d="M60 110 L40 100 M140 110 L160 100" opacity="0.55" />
      <path d="M100 130 L88 158 M100 130 L112 158" opacity="0.6" />
    </>
  ),
  pullup: (c) => (
    <>
      <Head cx={100} cy={96} />
      <path d="M100 103 L100 140" />
      <path d="M100 120 L78 150 M100 120 L122 150" opacity="0.6" />
      <path d="M100 110 L80 70 M100 110 L120 70" />
      <path d="M80 70 L70 50 M120 70 L130 50" opacity="0.55" />
      <path d="M40 40 L160 40" opacity="0.45" />
      <circle cx={70} cy={40} r={5} opacity={0.45} />
      <circle cx={130} cy={40} r={5} opacity={0.45} />
    </>
  ),
  curl: (c) => (
    <>
      <Head cx={100} cy={60} />
      <path d="M100 67 L100 120" />
      <path d="M100 130 L88 158 M100 130 L112 158" opacity="0.6" />
      <path d="M100 90 L70 96 M100 90 L130 96" />
      <path d="M70 96 L60 120 M130 96 L140 120" />
      <path d="M60 120 L70 100 M140 120 L130 100" opacity="0.6" />
    </>
  ),
  facepull: (c) => (
    <>
      <Head cx={100} cy={70} />
      <path d="M100 77 L100 120" />
      <path d="M100 130 L88 158 M100 130 L112 158" opacity="0.6" />
      <path d="M100 95 L64 84 M100 95 L136 84" />
      <path d="M64 84 L48 76 M136 84 L152 76" opacity="0.55" />
      <path d="M30 70 L170 70" opacity="0.4" />
    </>
  ),
  lsit: (c) => (
    <>
      <Head cx={100} cy={70} />
      <path d="M100 77 L100 116" />
      <path d="M100 116 L100 150" />
      <path d="M100 116 L150 116" />
      <path d="M100 130 L84 158 M100 130 L116 158" opacity="0.6" />
      <path d="M150 116 L150 150" opacity="0.4" />
    </>
  ),
  scap: (c) => (
    <>
      <Head cx={56} cy={118} />
      <path d="M63 118 L150 110" />
      <path d="M70 114 L70 150 M140 106 L140 150" opacity="0.6" />
      <path d="M56 125 L40 130" />
      <path d="M150 110 L168 102" opacity="0.55" />
    </>
  ),
  splitsquat: (c) => (
    <>
      <Head cx={70} cy={50} />
      <path d="M70 57 L70 110" />
      <path d="M70 110 L60 150" />
      <path d="M70 110 L120 110" opacity="0.55" />
      <path d="M120 110 L150 150" opacity="0.55" />
      <path d="M70 90 L100 70" opacity="0.5" />
    </>
  ),
  pistol: (c) => (
    <>
      <Head cx={70} cy={50} />
      <path d="M70 57 L70 120" />
      <path d="M70 120 L60 150" />
      <path d="M70 90 L150 90" />
      <path d="M150 90 L160 80" opacity="0.55" />
      <path d="M70 90 L52 80" opacity="0.5" />
    </>
  ),
  hollow: (c) => (
    <>
      <Head cx={56} cy={96} />
      <path d="M63 96 Q100 70 150 96" />
      <path d="M120 92 L150 60" />
      <path d="M70 100 L40 130" opacity="0.6" />
      <path d="M150 96 L168 80" opacity="0.55" />
    </>
  ),
  prehab: (c) => (
    <>
      <Head cx={100} cy={70} />
      <path d="M100 77 L100 130" />
      <path d="M100 90 L60 100 M100 90 L140 100" />
      <path d="M60 100 L48 108 M140 100 L152 108" opacity="0.6" />
      <path d="M100 130 L88 156 M100 130 L112 156" opacity="0.6" />
      <circle cx={100} cy={150} r={14} opacity={0.25} />
    </>
  ),
  squat: (c) => (
    <>
      <Head cx={100} cy={58} />
      <path d="M100 65 L100 104" />
      <path d="M100 104 L78 132 L84 150" />
      <path d="M100 104 L122 132 L116 150" />
      <path d="M100 82 L74 96 M100 82 L126 96" opacity="0.6" />
      <path d="M74 96 L70 110 M126 96 L130 110" opacity="0.5" />
    </>
  ),
  calf: (c) => (
    <>
      <Head cx={100} cy={50} />
      <path d="M100 57 L100 120" />
      <path d="M100 120 L92 150 M100 120 L108 150" />
      <path d="M100 88 L78 98 M100 88 L122 98" opacity="0.5" />
      <path d="M92 150 L100 140 L108 150" opacity="0.5" />
    </>
  ),
  legraise: (c) => (
    <>
      <path d="M40 42 L160 42" opacity="0.4" />
      <Head cx={100} cy={74} />
      <path d="M100 81 L100 112" />
      <path d="M100 92 L78 48 M100 92 L122 48" opacity="0.6" />
      <path d="M100 112 L80 96 M100 112 L120 96" />
      <circle cx={78} cy={48} r={5} opacity={0.45} />
      <circle cx={122} cy={48} r={5} opacity={0.45} />
    </>
  ),
  rdl: (c) => (
    <>
      <Head cx={70} cy={72} />
      <path d="M77 72 L120 104" />
      <path d="M120 104 L112 150 M120 104 L128 150" />
      <path d="M104 92 L138 96 M104 92 L138 104" opacity="0.5" />
      <circle cx={142} cy={96} r={5} opacity={0.5} />
      <circle cx={142} cy={104} r={5} opacity={0.5} />
    </>
  ),
  rest: (c) => (
    <>
      <Head cx={100} cy={70} />
      <path d="M100 77 L100 130" />
      <path d="M100 95 L70 110 M100 95 L130 110" opacity="0.6" />
      <path d="M100 130 L88 156 M100 130 L112 156" opacity="0.6" />
    </>
  ),
};

export default function ExerciseVisual({ visualId, category = 'skill', className = '', color }) {
  const pose = POSES[visualId] || POSES.rest;
  return (
    <div className={className}>
      <Figure color={color}>{pose()}</Figure>
    </div>
  );
}