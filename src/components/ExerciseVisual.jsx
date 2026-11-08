import React from 'react';

// Biomechanically accurate SVG calisthenics illustrations.
// Color-coded by exercise category:
// - Push: Warm Amber (#F5A623)
// - Pull: Sky Blue (#3FB6F8)
// - Legs: Emerald Green (#34D399)
// - Core: Violet/Purple (#A78BFA)
// - Skill: Cool Steel/Slate (#9AA7B8)
// - Prehab: Rose/Pink (#FB7BA0)
//
// Features articulated multi-segment arms (shoulder -> elbow -> forearm -> wrist/hand)
// and clean neutral apparatus context (bars, rings, floor, benches).

const STROKE = 3.4;

export const CATEGORY_COLORS = {
  push: '#F5A623',
  pull: '#3FB6F8',
  legs: '#34D399',
  core: '#A78BFA',
  skill: '#9AA7B8',
  prehab: '#FB7BA0',
};

function Figure({ children, athleteColor, className = '' }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
      style={{ color: 'currentColor' }}
    >
      {children}
    </svg>
  );
}

// Helpers
const Head = ({ cx, cy, r = 7.5, color }) => (
  <circle
    cx={cx}
    cy={cy}
    r={r}
    stroke={color}
    strokeWidth={STROKE}
    fill="color-mix(in srgb, currentColor 8%, transparent)"
  />
);

const Floor = ({ y = 165, startX = 20, endX = 180 }) => (
  <g opacity="0.38" stroke="currentColor">
    <line x1={startX} y1={y} x2={endX} y2={y} strokeWidth={2.4} strokeLinecap="round" />
    <line x1={startX + 20} y1={y} x2={startX + 12} y2={y + 7} strokeWidth={1.8} strokeLinecap="round" />
    <line x1={startX + 60} y1={y} x2={startX + 52} y2={y + 7} strokeWidth={1.8} strokeLinecap="round" />
    <line x1={startX + 100} y1={y} x2={startX + 92} y2={y + 7} strokeWidth={1.8} strokeLinecap="round" />
    <line x1={startX + 140} y1={y} x2={startX + 132} y2={y + 7} strokeWidth={1.8} strokeLinecap="round" />
  </g>
);

const OverheadBar = ({ y = 40, startX = 15, endX = 185 }) => (
  <g opacity="0.55" stroke="currentColor">
    <line x1={startX} y1={y} x2={endX} y2={y} strokeWidth={3.8} strokeLinecap="round" />
    <circle cx={startX} cy={y} r={3.2} fill="currentColor" stroke="none" />
    <circle cx={endX} cy={y} r={3.2} fill="currentColor" stroke="none" />
  </g>
);

const Ring = ({ x, y = 84, topY = 15 }) => (
  <g opacity="0.5" stroke="currentColor">
    <line x1={x} y1={topY} x2={x} y2={y - 8} strokeWidth={1.8} strokeLinecap="round" />
    <circle cx={x} cy={y} r={8} strokeWidth={2.6} />
  </g>
);

const POSES = {
  // 1. Handstand (Inverted on floor, articulated locked arms with wrists on floor, vertical spine and legs)
  handstand: (c) => (
    <>
      <Floor y={165} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {/* Wrists on floor */}
        <line x1="76" y1="165" x2="88" y2="165" strokeWidth={4} />
        <line x1="112" y1="165" x2="124" y2="165" strokeWidth={4} />
        {/* Left arm: wrist -> elbow -> shoulder */}
        <path d="M82 165 L84 142 L86 120" />
        {/* Right arm: wrist -> elbow -> shoulder */}
        <path d="M118 165 L116 142 L114 120" />
        {/* Shoulder girdle */}
        <line x1="86" y1="120" x2="114" y2="120" />
        {/* Head between shoulders */}
        <Head cx={100} cy={128} color={c} />
        {/* Torso straight up */}
        <line x1="100" y1="120" x2="100" y2="76" />
        {/* Straight legs pointing up */}
        <path d="M100 76 L97 34 M100 76 L103 34" />
        {/* Pointed toes */}
        <path d="M97 34 L95 24 M103 34 L105 24" opacity="0.65" />
      </g>
    </>
  ),

  // 2. Planche (Horizontal straight body hovering, deep forward shoulder lean, articulated arms)
  planche: (c) => (
    <>
      <Floor y={165} />
      <rect x="66" y="162" width="18" height="5" rx="2" opacity="0.4" stroke="currentColor" strokeWidth={1.8} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {/* Wrist on floor/parallette */}
        <line x1="70" y1="165" x2="82" y2="165" strokeWidth={4} />
        {/* Articulated arm leaning forward: wrist -> elbow -> protracted shoulder */}
        <path d="M75 163 L62 140 L48 116" />
        {/* Head looking forward */}
        <Head cx={34} cy={108} color={c} />
        {/* Horizontal torso */}
        <line x1="48" y1="116" x2="100" y2="114" />
        {/* Legs straight back in air */}
        <path d="M100 114 L142 112 L178 110" />
        <path d="M100 114 L142 114 L178 112" opacity="0.6" />
      </g>
      {/* Forward shoulder lean indicator */}
      <line x1="75" y1="163" x2="75" y2="116" stroke="currentColor" strokeDasharray="3 3" opacity="0.25" strokeWidth={1.6} />
    </>
  ),

  // 3. Handstand Push-up (Inverted, 90° pushing elbow crease, dipping head)
  hspu: (c) => (
    <>
      <Floor y={165} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {/* Hands on floor */}
        <line x1="66" y1="165" x2="76" y2="165" strokeWidth={4} />
        <line x1="124" y1="165" x2="134" y2="165" strokeWidth={4} />
        {/* Left arm: wrist -> 90° elbow -> shoulder */}
        <path d="M71 165 L66 136 L84 120" />
        {/* Right arm: wrist -> 90° elbow -> shoulder */}
        <path d="M129 165 L134 136 L116 120" />
        {/* Shoulders */}
        <line x1="84" y1="120" x2="116" y2="120" />
        {/* Head dipping near floor */}
        <Head cx={100} cy={145} color={c} />
        {/* Torso */}
        <line x1="100" y1="120" x2="100" y2="76" />
        {/* Legs vertical */}
        <path d="M100 76 L97 32 M100 76 L103 32" />
        {/* Upward pressing arrows */}
        <path d="M48 146 L48 132 M45 137 L48 132 L51 137" opacity="0.5" strokeWidth={2} />
        <path d="M152 146 L152 132 M149 137 L152 132 L155 137" opacity="0.5" strokeWidth={2} />
      </g>
    </>
  ),

  // 4. Push-up (Floor plank, articulated arms with hands under chest)
  pushup: (c) => (
    <>
      <Floor y={160} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {/* Hand base */}
        <line x1="58" y1="160" x2="72" y2="160" strokeWidth={4} />
        {/* Left/visible arm: wrist -> elbow -> shoulder */}
        <path d="M65 160 L64 138 L66 116" />
        {/* Head looking forward */}
        <Head cx={48} cy={106} color={c} />
        {/* Rigid plank body */}
        <path d="M66 116 L114 132 L142 146 L168 160" />
        <path d="M66 116 L114 134 L142 148 L168 160" opacity="0.55" />
        <circle cx="168" cy="160" r="2.5" fill={c} stroke="none" />
      </g>
    </>
  ),

  // 5. Ring Push-up (Articulated arms gripping suspended rings)
  ringpushup: (c) => (
    <>
      <Floor y={165} />
      <Ring x={66} y={132} topY={20} />
      <Ring x={134} y={132} topY={20} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {/* Both hands hold separate rings; elbows stay under the shoulders */}
        <path d="M66 132 L64 118 L66 102" />
        <path d="M134 132 L136 118 L134 102" />
        <Head cx={48} cy={94} color={c} />
        <path d="M66 102 L114 124 L142 145 L168 165" />
        <path d="M66 102 L114 126 L142 147 L168 165" opacity="0.55" />
      </g>
    </>
  ),

  // 6. PPPUs (Wrists placed back near waist, articulated arms angling forward to shoulders)
  pppu: (c) => (
    <>
      <Floor y={160} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {/* Hand on floor placed back at x=108 */}
        <line x1="102" y1="160" x2="114" y2="160" strokeWidth={4} />
        {/* Articulated arm: wrist -> elbow -> forward shoulder */}
        <path d="M108 160 L86 138 L62 118" />
        <Head cx={44} cy={108} color={c} />
        <path d="M62 118 L114 134 L142 147 L170 160" />
        <path d="M62 118 L114 136 L142 149 L170 160" opacity="0.55" />
      </g>
      <line x1="108" y1="160" x2="108" y2="118" stroke="currentColor" strokeDasharray="3 3" opacity="0.25" strokeWidth={1.6} />
    </>
  ),

  // 7. Dip (Suspended between twin bars, 90° elbow bend, tricep contraction)
  dip: (c) => (
    <>
      <g opacity="0.45" stroke="currentColor">
        <path d="M42 114 L82 114 M118 114 L158 114" strokeWidth={3.6} strokeLinecap="round" />
        <line x1="56" y1="114" x2="56" y2="175" strokeWidth={3} strokeLinecap="round" />
        <line x1="144" y1="114" x2="144" y2="175" strokeWidth={3} strokeLinecap="round" />
      </g>
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {/* Hands on bars */}
        <circle cx="68" cy="114" r="3.2" fill={c} stroke="none" />
        <circle cx="132" cy="114" r="3.2" fill={c} stroke="none" />
        {/* Left arm: hand -> 90° elbow -> shoulder */}
        <path d="M68 114 L54 92 L78 96" />
        {/* Right arm: hand -> 90° elbow -> shoulder */}
        <path d="M132 114 L146 92 L122 96" />
        <Head cx={100} cy={74} color={c} />
        <line x1="100" y1="96" x2="100" y2="132" />
        <path d="M100 132 L110 154 L94 168" />
        <path d="M100 132 L106 154 L90 168" opacity="0.55" />
      </g>
    </>
  ),

  // 8. Front Lever (Horizontal face-up hang, articulated arms pulling into bar)
  frontlever: (c) => (
    <>
      <OverheadBar y={38} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="78" cy="38" r="3.4" fill={c} stroke="none" />
        {/* Arm: hand -> elbow -> shoulder */}
        <path d="M78 38 L78 64 L78 92" />
        <Head cx={58} cy={92} color={c} />
        <path d="M78 92 L116 92 L146 92 L178 92" />
        <path d="M78 92 L116 94 L146 94 L178 94" opacity="0.55" />
        <path d="M178 92 L186 90" opacity="0.65" />
      </g>
    </>
  ),

  // 9. Front Lever Row (Horizontal lever with elbows rowed high behind back, chest to bar)
  flrow: (c) => (
    <>
      <OverheadBar y={38} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="78" cy="38" r="3.4" fill={c} stroke="none" />
        {/* Rowed arm: hand -> elbow driven high behind back -> shoulder */}
        <path d="M78 38 L94 76 L78 64" />
        <Head cx={58} cy={64} color={c} />
        <path d="M78 64 L116 64 L146 64 L178 64" />
        <path d="M78 64 L116 66 L146 66 L178 66" opacity="0.55" />
        <path d="M96 52 L96 44 M93 47 L96 44 L99 47" opacity="0.5" strokeWidth={2} />
      </g>
    </>
  ),

  // 10. Muscle-up (Dynamic explosive transition popping over the pull-up bar)
  muscleup: (c) => (
    <>
      <OverheadBar y={92} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="76" cy="92" r="3.4" fill={c} stroke="none" />
        <circle cx="124" cy="92" r="3.4" fill={c} stroke="none" />
        {/* Left arm: hand on bar -> elbow flared up -> shoulder */}
        <path d="M76 92 L62 76 L80 62" />
        {/* Right arm: hand on bar -> elbow flared up -> shoulder */}
        <path d="M124 92 L138 76 L120 62" />
        <Head cx={100} cy={44} color={c} />
        <line x1="100" y1="62" x2="100" y2="114" />
        <path d="M100 114 L106 148 L102 178" />
        <path d="M100 114 L102 148 L98 178" opacity="0.55" />
      </g>
      <path d="M50 78 Q42 64 54 50" stroke="currentColor" opacity="0.35" strokeDasharray="3 3" />
      <path d="M150 78 Q158 64 146 50" stroke="currentColor" opacity="0.35" strokeDasharray="3 3" />
    </>
  ),

  // 11. Ring Row (Inverted row at 45° angle, heels on floor, chest pulled to rings)
  ringrow: (c) => (
    <>
      <Floor y={170} />
      <g opacity="0.5" stroke="currentColor">
        <line x1="72" y1="15" x2="78" y2="72" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx="78" cy="80" r="8" strokeWidth={2.6} />
        <line x1="128" y1="15" x2="122" y2="72" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx="122" cy="80" r="8" strokeWidth={2.6} />
      </g>
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {/* Both hands row to separate rings; torso stays braced in a straight diagonal */}
        <path d="M78 80 L92 98 L100 104" />
        <path d="M122 80 L108 98 L100 104" />
        <Head cx={82} cy={74} color={c} />
        <path d="M92 90 L122 126 L160 170" />
        <path d="M92 90 L124 128 L160 170" opacity="0.55" />
        <circle cx="160" cy="170" r="2.5" fill={c} stroke="none" />
      </g>
    </>
  ),

  // 12. Pull-up (Chin cleared over bar, elbows driven down into ribs)
  pullup: (c) => (
    <>
      <OverheadBar y={42} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="74" cy="42" r="3.4" fill={c} stroke="none" />
        <circle cx="126" cy="42" r="3.4" fill={c} stroke="none" />
        {/* Chin cleared above bar */}
        <Head cx={100} cy={28} color={c} />
        {/* Left arm: hand -> elbow driven down -> shoulder */}
        <path d="M74 42 L58 68 L82 56" />
        {/* Right arm: hand -> elbow driven down -> shoulder */}
        <path d="M126 42 L142 68 L118 56" />
        <line x1="100" y1="56" x2="100" y2="108" />
        <path d="M100 108 L98 144 L98 176" />
        <path d="M100 108 L102 144 L102 176" opacity="0.55" />
      </g>
    </>
  ),

  // 13. L-Sit (Crisp 90° right angle: locked arms pressing down, horizontal legs)
  lsit: (c) => (
    <>
      <Floor y={165} />
      <rect x="70" y="152" width="20" height="6" rx="2" opacity="0.4" stroke="currentColor" strokeWidth={1.8} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {/* Hand on block -> elbow -> shoulder */}
        <path d="M78 152 L79 128 L80 106" />
        <Head cx={80} cy={88} color={c} />
        <line x1="80" y1="106" x2="80" y2="136" />
        <path d="M80 136 L126 136 L168 136" />
        <path d="M80 138 L126 138 L168 138" opacity="0.55" />
        <path d="M168 136 L174 130" opacity="0.65" />
      </g>
      <path d="M88 136 A 8 8 0 0 1 80 128" stroke={c} opacity="0.4" strokeWidth={1.8} />
    </>
  ),

  // 14. Pistol Squat (Deep single-leg squat, non-working leg forward, counter-balance arms)
  pistol: (c) => (
    <>
      <Floor y={170} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="78" cy="170" r="2.5" fill={c} stroke="none" />
        <path d="M78 170 L56 142 L80 136" />
        <path d="M80 136 L120 136 L160 134" />
        <path d="M80 138 L120 138 L160 136" opacity="0.55" />
        <line x1="80" y1="136" x2="76" y2="96" />
        <Head cx={76} cy={78} color={c} />
        {/* Articulated counter-balance arms reaching forward */}
        <path d="M76 96 L98 100 L122 102" />
        <path d="M76 96 L94 106 L118 108" opacity="0.6" />
      </g>
    </>
  ),

  // 15. Bulgarian Split Squat (Rear foot elevated on bench, articulated arms holding dumbbells)
  splitsquat: (c) => (
    <>
      <Floor y={170} />
      <path d="M138 134 L175 134 L175 170 L138 170 Z" opacity="0.38" stroke="currentColor" strokeWidth={2.4} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M148 134 L126 156 L105 116" />
        <path d="M105 116 L72 136 L72 170" />
        <circle cx="72" cy="170" r="2.5" fill={c} stroke="none" />
        <line x1="105" y1="116" x2="105" y2="76" />
        <Head cx={105} cy={58} color={c} />
        {/* Left arm: shoulder -> elbow -> hand holding dumbbell */}
        <path d="M105 76 L94 96 L94 114" />
        {/* Right arm: shoulder -> elbow -> hand holding dumbbell */}
        <path d="M105 76 L116 96 L116 114" />
        {/* Dumbbells */}
        <line x1="88" y1="114" x2="100" y2="114" strokeWidth={4} />
        <line x1="110" y1="114" x2="122" y2="114" strokeWidth={4} />
      </g>
    </>
  ),

  // 16. Squat (Symmetrical bilateral squat, hips below parallel, articulated reaching arms)
  squat: (c) => (
    <>
      <Floor y={170} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="70" cy="170" r="2.5" fill={c} stroke="none" />
        <circle cx="130" cy="170" r="2.5" fill={c} stroke="none" />
        <path d="M70 170 L58 138 L100 140" />
        <path d="M130 170 L142 138 L100 140" />
        <line x1="100" y1="140" x2="100" y2="94" />
        <Head cx={100} cy={76} color={c} />
        {/* Left articulated arm reaching forward */}
        <path d="M100 94 L84 104 L96 112" />
        {/* Right articulated arm reaching forward */}
        <path d="M100 94 L116 104 L104 112" />
      </g>
    </>
  ),

  // 17. Calf Raise (Standing on step edge, heels pushed high in maximum plantarflexion)
  calf: (c) => (
    <>
      <path d="M25 162 L120 162 L120 185 L175 185" stroke="currentColor" strokeWidth={2.8} opacity="0.45" />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="112" cy="162" r="2.5" fill={c} stroke="none" />
        <line x1="112" y1="162" x2="90" y2="138" />
        <path d="M96 142 L98 105 L98 75" />
        <line x1="98" y1="75" x2="98" y2="45" />
        <Head cx={98} cy={30} color={c} />
        {/* Soft articulated arms */}
        <path d="M98 45 L90 68 L92 88" />
        {/* Elevation arrow */}
        <path d="M74 154 L74 136 M70 141 L74 136 L78 141" opacity="0.55" strokeWidth={2} />
      </g>
    </>
  ),

  // 18. Hollow Body Hold (Banana dish curve: shoulders & legs hovering, active arms overhead)
  hollow: (c) => (
    <>
      <Floor y={162} />
      <circle cx="100" cy="155" r="3" fill="currentColor" opacity="0.4" />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        {/* Articulated arms reaching overhead */}
        <path d="M30 116 L44 124 L58 132" />
        {/* Banana crescent curve */}
        <path d="M58 132 Q100 156 140 142 L168 130" />
        <path d="M60 134 Q100 158 140 144 L168 132" opacity="0.55" />
        <Head cx={52} cy={124} color={c} />
      </g>
      <path d="M84 146 Q100 138 116 146" stroke="currentColor" opacity="0.3" strokeDasharray="2 2" strokeWidth={1.8} />
    </>
  ),

  // 19. Hanging Leg Raise (Hanging from bar, straight legs hoisted up horizontally)
  legraise: (c) => (
    <>
      <OverheadBar y={38} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="84" cy="38" r="3.4" fill={c} stroke="none" />
        <circle cx="116" cy="38" r="3.4" fill={c} stroke="none" />
        {/* Arms: hand -> elbow -> shoulder */}
        <path d="M84 38 L84 54 L84 70" />
        <path d="M116 38 L116 54 L116 70" />
        <Head cx={100} cy={58} color={c} />
        <line x1="100" y1="70" x2="100" y2="116" />
        <path d="M100 116 L138 116 L172 116" />
        <path d="M100 118 L138 118 L172 118" opacity="0.55" />
      </g>
      <path d="M108 160 Q138 155 162 126" stroke="currentColor" strokeDasharray="3 3" opacity="0.35" strokeWidth={1.8} />
      <path d="M158 126 L164 126 L164 132" stroke="currentColor" opacity="0.4" strokeWidth={1.8} />
    </>
  ),

  // 20. Romanian Deadlift (Hip hinge with flat back, articulated arms along shins holding weights)
  rdl: (c) => (
    <>
      <Floor y={170} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="95" cy="170" r="2.5" fill={c} stroke="none" />
        <line x1="95" y1="170" x2="98" y2="136" />
        <line x1="98" y1="136" x2="136" y2="114" />
        <line x1="136" y1="114" x2="74" y2="96" />
        <Head cx={60} cy={86} color={c} />
        {/* Articulated arm: shoulder -> elbow -> hand */}
        <path d="M74 96 L74 118 L74 140" />
        {/* Dumbbell / weight bar */}
        <line x1="64" y1="140" x2="84" y2="140" strokeWidth={4} />
        <circle cx="64" cy="140" r="4" fill={c} stroke="none" opacity="0.75" />
        <circle cx="84" cy="140" r="4" fill={c} stroke="none" opacity="0.75" />
      </g>
      <path d="M124 100 Q136 102 144 110" stroke="currentColor" opacity="0.35" strokeDasharray="2 2" strokeWidth={1.8} />
    </>
  ),

  // 21. Bicep Curl (Standing upright, elbows pinned, forearms curled up into bicep contraction)
  curl: (c) => (
    <>
      <Floor y={170} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M100 110 L88 170 M100 110 L112 170" />
        <line x1="100" y1="110" x2="100" y2="68" />
        <Head cx={100} cy={50} color={c} />
        {/* Left arm: shoulder -> pinned elbow -> curled forearm/hand */}
        <path d="M100 68 L80 90 L84 62" />
        {/* Right arm: shoulder -> pinned elbow -> curled forearm/hand */}
        <path d="M100 68 L120 90 L116 62" />
        {/* Dumbbells in hands */}
        <rect x="76" y="58" width="16" height="6" rx="2" fill={c} stroke="none" opacity="0.8" />
        <rect x="108" y="58" width="16" height="6" rx="2" fill={c} stroke="none" opacity="0.8" />
      </g>
    </>
  ),

  // 22. Face Pull (High elbows pulling cables/ropes back beside temples)
  facepull: (c) => (
    <>
      <g opacity="0.45" stroke="currentColor">
        <path d="M20 62 L55 62" strokeWidth={2.4} />
        <line x1="55" y1="62" x2="86" y2="52" />
        <line x1="55" y1="62" x2="86" y2="72" />
      </g>
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="86" cy="52" r="3" fill={c} stroke="none" />
        <circle cx="86" cy="72" r="3" fill={c} stroke="none" />
        {/* Left arm: hand -> high flared elbow -> shoulder */}
        <path d="M86 52 L116 50 L104 74" />
        {/* Right arm: hand -> high flared elbow -> shoulder */}
        <path d="M86 72 L116 76 L104 74" />
        <Head cx={98} cy={62} color={c} />
        <line x1="104" y1="74" x2="112" y2="116" />
        <path d="M112 116 L102 170 M112 116 L124 170" />
      </g>
    </>
  ),

  // 23. Rear Delt Fly (Hinged torso with arms flared wide horizontally in reverse fly)
  reardeltfly: (c) => (
    <>
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <line x1="126" y1="114" x2="84" y2="98" />
        <Head cx={70} cy={90} color={c} />
        <path d="M126 114 L118 142 L118 170" />
        <path d="M126 114 L132 142 L132 170" opacity="0.55" />
        {/* Articulated wide horizontal wingspan with soft elbows */}
        <path d="M48 82 L66 88 L84 98 L102 88 L122 82" />
        {/* Weights */}
        <circle cx="48" cy="82" r="4" fill={c} stroke="none" opacity="0.75" />
        <circle cx="122" cy="82" r="4" fill={c} stroke="none" opacity="0.75" />
        {/* Squeeze lines */}
        <path d="M78 88 L82 92 M90 88 L86 92" opacity="0.45" strokeWidth={1.8} />
      </g>
    </>
  ),

  // 24. Scapular Pulls / Shrugs (Locked straight arms hanging from bar, scapular depression)
  scap: (c) => (
    <>
      <OverheadBar y={38} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="82" cy="38" r="3.4" fill={c} stroke="none" />
        <circle cx="118" cy="38" r="3.4" fill={c} stroke="none" />
        {/* Left arm: hand -> elbow -> shoulder */}
        <path d="M82 38 L82 58 L82 78" />
        {/* Right arm: hand -> elbow -> shoulder */}
        <path d="M118 38 L118 58 L118 78" />
        <line x1="82" y1="78" x2="118" y2="78" />
        <Head cx={100} cy={52} color={c} />
        <line x1="100" y1="78" x2="100" y2="120" />
        <path d="M100 120 L98 174 M100 120 L102 174" />
        {/* Depressing motion arrows */}
        <path d="M68 64 L68 76 M65 72 L68 76 L71 72" opacity="0.55" strokeWidth={2} />
        <path d="M132 64 L132 76 M129 72 L132 76 L135 72" opacity="0.55" strokeWidth={2} />
      </g>
    </>
  ),

  // 25. Prehab (Joint mobility circles & warm-up rotational stretch cues)
  prehab: (c) => (
    <>
      <Floor y={170} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M100 110 L90 170 M100 110 L110 170" />
        <line x1="100" y1="110" x2="100" y2="68" />
        <Head cx={100} cy={50} color={c} />
        {/* Articulated warm-up arms */}
        <path d="M100 68 L72 84 L54 68" />
        <path d="M100 68 L128 84 L146 68" />
      </g>
      <circle cx="54" cy="68" r="13" stroke={c} opacity="0.35" strokeDasharray="3 3" strokeWidth={1.8} />
      <circle cx="146" cy="68" r="13" stroke={c} opacity="0.35" strokeDasharray="3 3" strokeWidth={1.8} />
      <circle cx="100" cy="110" r="18" stroke="currentColor" opacity="0.2" strokeDasharray="4 4" strokeWidth={1.8} />
    </>
  ),

  // 27. Ring Dip (Gymnastic rings on hanging straps, deep 90° dip, suspended body)
  ringdip: (c) => (
    <>
      <g opacity="0.5" stroke="currentColor">
        <line x1="66" y1="15" x2="66" y2="92" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx="66" cy="100" r="8" strokeWidth={2.6} />
        <line x1="134" y1="15" x2="134" y2="92" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx="134" cy="100" r="8" strokeWidth={2.6} />
      </g>
      <path d="M52 98 Q48 100 52 102" stroke="currentColor" opacity="0.35" strokeWidth={1.5} />
      <path d="M148 98 Q152 100 148 102" stroke="currentColor" opacity="0.35" strokeWidth={1.5} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="66" cy="100" r="3.2" fill={c} stroke="none" />
        <circle cx="134" cy="100" r="3.2" fill={c} stroke="none" />
        <path d="M66 100 L50 82 L76 86" />
        <path d="M134 100 L150 82 L124 86" />
        <line x1="76" y1="86" x2="124" y2="86" />
        <Head cx={100} cy={66} color={c} />
        <line x1="100" y1="86" x2="100" y2="126" />
        <path d="M100 126 L112 148 L96 166" />
        <path d="M100 126 L108 148 L92 166" opacity="0.55" />
      </g>
    </>
  ),

  // 28. Chair Dip (Bench/chair behind athlete, hands on seat front edge, legs extended forward)
  chairdip: (c) => (
    <>
      <Floor y={165} />
      <g opacity="0.45" stroke="currentColor">
        <line x1="116" y1="124" x2="170" y2="124" strokeWidth={3.2} strokeLinecap="round" />
        <line x1="166" y1="124" x2="166" y2="76" strokeWidth={3} strokeLinecap="round" />
        <line x1="166" y1="124" x2="166" y2="165" strokeWidth={2.4} strokeLinecap="round" />
        <line x1="122" y1="124" x2="122" y2="165" strokeWidth={2.4} strokeLinecap="round" />
      </g>
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="120" cy="124" r="3.2" fill={c} stroke="none" />
        <path d="M120 124 L138 102 L114 98" />
        <Head cx={102} cy={78} color={c} />
        <line x1="110" y1="98" x2="106" y2="136" />
        <path d="M106 136 L68 152 L42 165" />
        <path d="M106 136 L70 154 L44 165" opacity="0.55" />
        <circle cx="42" cy="165" r="2.5" fill={c} stroke="none" />
      </g>
      <path d="M130 92 L130 80 M127 84 L130 80 L133 84" opacity="0.45" stroke="currentColor" strokeWidth={1.8} />
    </>
  ),

  // 29. Ring Support Hold (Suspended rings, straight-arm lockout, rings turned out)
  ringsupport: (c) => (
    <>
      <g opacity="0.5" stroke="currentColor">
        <line x1="68" y1="15" x2="68" y2="104" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx="68" cy="112" r="8" strokeWidth={2.6} />
        <line x1="132" y1="15" x2="132" y2="104" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx="132" cy="112" r="8" strokeWidth={2.6} />
      </g>
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M80 84 L74 98 L68 112" />
        <path d="M120 84 L126 98 L132 112" />
        <circle cx="68" cy="112" r="3.2" fill={c} stroke="none" />
        <circle cx="132" cy="112" r="3.2" fill={c} stroke="none" />
        <line x1="80" y1="84" x2="120" y2="84" />
        <Head cx={100} cy={64} color={c} />
        <line x1="100" y1="84" x2="100" y2="128" />
        <path d="M100 128 L98 156 L97 182" />
        <path d="M100 128 L102 156 L103 182" opacity="0.55" />
      </g>
      <path d="M56 116 Q52 112 54 106 M51 108 L54 106 L57 109" opacity="0.55" stroke="currentColor" strokeWidth={1.6} />
      <path d="M144 116 Q148 112 146 106 M143 109 L146 106 L149 108" opacity="0.55" stroke="currentColor" strokeWidth={1.6} />
    </>
  ),

  // 30. Deficit Push-up (Elevated parallettes on floor, deep chest sink below hand level)
  deficitpushup: (c) => (
    <>
      <Floor y={165} />
      <g opacity="0.45" stroke="currentColor">
        <path d="M50 165 L50 146 L82 146 L82 165" strokeWidth={2.8} strokeLinecap="round" />
        <line x1="44" y1="146" x2="88" y2="146" strokeWidth={3.4} strokeLinecap="round" />
      </g>
      <line x1="40" y1="146" x2="105" y2="146" stroke="currentColor" opacity="0.25" strokeDasharray="3 3" strokeWidth={1.5} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="66" cy="146" r="3.2" fill={c} stroke="none" />
        <path d="M66 146 L82 128 L66 156" />
        <Head cx={46} cy={152} color={c} />
        <path d="M66 156 L112 158 L144 162 L170 165" />
        <path d="M66 156 L112 160 L144 163 L170 165" opacity="0.55" />
        <circle cx="170" cy="165" r="2.5" fill={c} stroke="none" />
      </g>
    </>
  ),

  // 31. Decline Push-up (Feet elevated on box, body sloping downward, chest near floor)
  declinepushup: (c) => (
    <>
      <Floor y={165} />
      <path d="M136 122 L178 122 L178 165 L136 165 Z" opacity="0.4" stroke="currentColor" strokeWidth={2.2} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <line x1="58" y1="165" x2="72" y2="165" strokeWidth={4} />
        <path d="M65 165 L66 142 L68 122" />
        <Head cx={50} cy={112} color={c} />
        <path d="M68 122 L112 122 L144 122" />
        <path d="M68 124 L112 124 L144 122" opacity="0.55" />
        <circle cx="144" cy="122" r="2.5" fill={c} stroke="none" />
      </g>
      <path d="M112 138 L104 144 M104 138 L104 144 L110 144" opacity="0.4" stroke="currentColor" strokeWidth={1.8} />
    </>
  ),

  // 32. Feet-Elevated Row (Suspended rings + box, horizontal face-up lever row)
  feet_elev_row: (c) => (
    <>
      <Floor y={170} />
      <g opacity="0.5" stroke="currentColor">
        <line x1="72" y1="15" x2="72" y2="76" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx="72" cy="84" r="8" strokeWidth={2.6} />
      </g>
      <path d="M140 102 L178 102 L178 170 L140 170 Z" opacity="0.4" stroke="currentColor" strokeWidth={2.2} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="72" cy="84" r="3.2" fill={c} stroke="none" />
        <path d="M72 84 L90 70 L76 90" />
        <Head cx={58} cy={88} color={c} />
        <path d="M76 90 L116 96 L150 102" />
        <path d="M76 92 L116 98 L150 102" opacity="0.55" />
        <circle cx="150" cy="102" r="2.5" fill={c} stroke="none" />
      </g>
    </>
  ),

  // 33. Step-up (High plyo box, lead foot planted at 90°, upright torso with dumbbells)
  stepup: (c) => (
    <>
      <Floor y={170} />
      <path d="M116 108 L174 108 L174 170 L116 170 Z" opacity="0.4" stroke="currentColor" strokeWidth={2.4} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="132" cy="108" r="2.5" fill={c} stroke="none" />
        <path d="M132 108 L118 84 L102 96" />
        <path d="M102 96 L96 132 L90 170" />
        <circle cx="90" cy="170" r="2.5" fill={c} stroke="none" />
        <line x1="102" y1="96" x2="104" y2="56" />
        <Head cx={104} cy={40} color={c} />
        <path d="M104 56 L94 76 L94 96" />
        <path d="M104 56 L112 76 L112 96" />
        <rect x="88" y="94" width="12" height="5" rx="1.5" fill={c} stroke="none" />
        <rect x="106" y="94" width="12" height="5" rx="1.5" fill={c} stroke="none" />
      </g>
      <path d="M148 94 L148 74 M144 79 L148 74 L152 79" opacity="0.55" stroke="currentColor" strokeWidth={2} />
    </>
  ),

  // 34. Chin-up (Underhand supinated grip on bar, chin cleared high over bar, bicep peak)
  chinup: (c) => (
    <>
      <OverheadBar y={42} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="86" cy="42" r="3.4" fill={c} stroke="none" />
        <circle cx="114" cy="42" r="3.4" fill={c} stroke="none" />
        <Head cx={100} cy={26} color={c} />
        <path d="M86 42 L72 64 L86 52" />
        <path d="M114 42 L128 64 L114 52" />
        <line x1="100" y1="52" x2="100" y2="108" />
        <path d="M100 108 L98 144 L96 174" />
        <path d="M100 108 L102 144 L100 174" opacity="0.55" />
      </g>
      <path d="M68 58 Q64 64 68 70" stroke={c} opacity="0.4" strokeWidth={1.8} />
      <path d="M132 58 Q136 64 132 70" stroke={c} opacity="0.4" strokeWidth={1.8} />
    </>
  ),

  // 35. Hanging Knee Raise (Overhead bar hang, thighs tucked up at 90°, knees to chest)
  hanging_knee: (c) => (
    <>
      <OverheadBar y={38} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="82" cy="38" r="3.4" fill={c} stroke="none" />
        <circle cx="118" cy="38" r="3.4" fill={c} stroke="none" />
        <path d="M82 38 L82 54 L82 70" />
        <path d="M118 38 L118 54 L118 70" />
        <Head cx={100} cy={58} color={c} />
        <line x1="100" y1="70" x2="100" y2="114" />
        <path d="M100 114 L142 110 L142 146" />
        <path d="M100 116 L144 112 L144 148" opacity="0.55" />
      </g>
      <path d="M110 162 Q144 162 148 126" stroke="currentColor" strokeDasharray="3 3" opacity="0.35" strokeWidth={1.8} />
      <path d="M144 126 L148 126 L148 132" stroke="currentColor" opacity="0.4" strokeWidth={1.8} />
    </>
  ),

  // 36. Bent-Knee Calf Raise (Seated on bench, dumbbell resting on 90° knee, heel raised high)
  bent_knee_calf: (c) => (
    <>
      <Floor y={170} />
      <path d="M52 122 L110 122 L110 170 L52 170 Z" opacity="0.38" stroke="currentColor" strokeWidth={2.4} />
      <path d="M126 162 L164 162 L164 170 L126 170 Z" opacity="0.45" stroke="currentColor" strokeWidth={2.2} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <line x1="88" y1="122" x2="88" y2="74" />
        <Head cx={88} cy={58} color={c} />
        <path d="M88 122 L132 122 L136 150 L142 162" />
        <circle cx="142" cy="162" r="2.5" fill={c} stroke="none" />
        <line x1="132" y1="92" x2="132" y2="120" strokeWidth={5} stroke={c} strokeLinecap="round" />
        <rect x="124" y="88" width="16" height="5" rx="1.5" fill={c} stroke="none" />
        <rect x="124" y="117" width="16" height="5" rx="1.5" fill={c} stroke="none" />
        <path d="M88 74 L108 94 L130 104" />
      </g>
      <path d="M148 152 L148 138 M145 142 L148 138 L151 142" opacity="0.55" stroke="currentColor" strokeWidth={1.8} />
    </>
  ),

  // 37. Pike Push-up (Inverted V pike on floor, hands planted, hips high at apex, head dipping)
  pikepushup: (c) => (
    <>
      <Floor y={165} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <line x1="60" y1="165" x2="72" y2="165" strokeWidth={4} />
        <path d="M66 165 L56 138 L74 126" />
        <Head cx={64} cy={150} color={c} />
        <line x1="74" y1="126" x2="108" y2="86" />
        <path d="M108 86 L130 126 L152 165" />
        <path d="M108 86 L132 126 L154 165" opacity="0.55" />
        <circle cx="152" cy="165" r="2.5" fill={c} stroke="none" />
      </g>
      <line x1="108" y1="86" x2="66" y2="152" stroke="currentColor" strokeDasharray="3 3" opacity="0.25" strokeWidth={1.5} />
    </>
  ),

  // 38. Rest (Seated calm athlete on gym box/bench with breathing wave)
  rest: (c) => (
    <>
      <Floor y={170} />
      <path d="M68 130 L132 130 L132 170 L68 170 Z" opacity="0.38" stroke="currentColor" strokeWidth={2.4} />
      <g stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <line x1="100" y1="130" x2="100" y2="85" />
        <Head cx={100} cy={68} color={c} />
        {/* Articulated arms resting calmly on knees: shoulder -> elbow -> hand */}
        <path d="M100 85 L78 106 L82 128" />
        <path d="M100 85 L122 106 L118 128" />
        <path d="M100 130 L84 134 L84 170" />
        <path d="M100 130 L116 134 L116 170" opacity="0.55" />
      </g>
      <path d="M80 54 Q100 44 120 54" stroke={c} opacity="0.4" strokeDasharray="3 3" strokeWidth={1.8} />
      <path d="M86 44 Q100 36 114 44" stroke={c} opacity="0.3" strokeDasharray="3 3" strokeWidth={1.8} />
    </>
  ),
};

export default function ExerciseVisual({
  visualId,
  category = 'skill',
  className = '',
  color,
  badge = false,
}) {
  const themeColor = color || CATEGORY_COLORS[category] || '#3FB6F8';
  const pose = POSES[visualId] || POSES.rest;

  if (badge) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl border bg-card/95 p-2.5 transition-transform ${className}`}
        style={{
          borderColor: `color-mix(in srgb, ${themeColor} 40%, hsl(var(--border)))`,
          boxShadow: `0 8px 24px -6px color-mix(in srgb, ${themeColor} 24%, transparent)`,
        }}
      >
        <Figure athleteColor={themeColor}>{pose(themeColor)}</Figure>
      </div>
    );
  }

  return (
    <div className={className}>
      <Figure athleteColor={themeColor}>{pose(themeColor)}</Figure>
    </div>
  );
}