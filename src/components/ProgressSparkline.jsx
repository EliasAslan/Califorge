import React from 'react';

// Compact, non-decorative trend line: best metric per session over time.
// Renders nothing meaningful with fewer than 2 points (caller guards).
export default function ProgressSparkline({ data, accent = '#9AA7B8', height = 44 }) {
  if (!data || data.length < 2) {
    return <p className="text-xs text-muted-foreground">Not enough data for a trend yet.</p>;
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const pad = 4;

  const pts = data.map((d, i) => {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    const y = height - pad - ((d.value - min) / range) * (height - pad * 2);
    return [x, y];
  });

  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${height} L0,${height} Z`;
  const gid = `spark-${accent.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill={accent} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}