// Rest-timer feedback: sound + vibration, with graceful fallback.
// Both respect the user's settings and silently no-op if the capability is missing.
import { loadSettings } from './storage';

let audioCtx = null;
const getCtx = () => {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = audioCtx || new Ctor();
    return audioCtx;
  } catch {
    return null;
  }
};

// Short two-tone "rest done" chime via the Web Audio API (no asset needed).
export const playRestCompleteSound = () => {
  if (!loadSettings().restSound) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(880, now);
    o.frequency.setValueAtTime(1320, now + 0.14);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    o.start(now);
    o.stop(now + 0.42);
  } catch {
    /* audio unavailable — silent fallback */
  }
};

export const vibrate = (pattern = [120, 60, 120]) => {
  if (!loadSettings().restVibration) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* vibration unavailable — silent fallback */
  }
};