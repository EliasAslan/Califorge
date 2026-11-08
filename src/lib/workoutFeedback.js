// Small, optional audio and haptic cues for meaningful workout interactions.
// Rest alerts keep their own settings so interface feedback can be muted independently.
import { loadSettings } from './storage.js';

let audioContext = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContext = audioContext || new AudioContextCtor();
    if (audioContext.state === 'suspended') {
      const resume = audioContext.resume();
      resume?.catch?.(() => {});
    }
    return audioContext;
  } catch {
    return null;
  }
};

const playTones = (notes) => {
  const context = getAudioContext();
  if (!context) return;
  try {
    const startAt = context.currentTime;
    notes.forEach((note) => {
      const { frequency, delay = 0, duration = 0.07, volume = 0.03, type = 'sine' } = note;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = startAt + delay;
      const end = start + duration;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(end + 0.01);
    });
  } catch {
    // Audio is an enhancement; unsupported or blocked audio stays silent.
  }
};

const UI_CUES = {
  selection: [{ frequency: 620, duration: 0.035, volume: 0.012 }],
  confirm: [
    { frequency: 720, duration: 0.055, volume: 0.022 },
    { frequency: 960, delay: 0.055, duration: 0.07, volume: 0.024 },
  ],
  setComplete: [
    { frequency: 660, duration: 0.075, volume: 0.03 },
    { frequency: 880, delay: 0.07, duration: 0.09, volume: 0.032 },
  ],
  workoutStart: [
    { frequency: 523, duration: 0.09, volume: 0.026 },
    { frequency: 659, delay: 0.09, duration: 0.1, volume: 0.03 },
    { frequency: 784, delay: 0.19, duration: 0.12, volume: 0.034 },
  ],
  workoutFinish: [
    { frequency: 523, duration: 0.1, volume: 0.026 },
    { frequency: 659, delay: 0.09, duration: 0.1, volume: 0.03 },
    { frequency: 784, delay: 0.18, duration: 0.11, volume: 0.032 },
    { frequency: 1046, delay: 0.28, duration: 0.16, volume: 0.036 },
  ],
};

const HAPTIC_CUES = {
  tick: [5],
  selection: [8],
  confirm: [12],
  setComplete: [18, 35, 12],
  workoutStart: [18, 35, 24],
  workoutFinish: [35, 45, 30, 60, 70],
};

export const playUiSound = (cue = 'selection') => {
  if (!loadSettings().interfaceSound) return;
  const notes = UI_CUES[cue];
  if (notes) playTones(notes);
};

export const haptic = (cue = 'selection') => {
  if (!loadSettings().interfaceHaptics) return;
  const pattern = HAPTIC_CUES[cue] || HAPTIC_CUES.selection;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Vibration is unavailable on some devices and browsers.
  }
};

export const triggerFeedback = (cue = 'selection') => {
  haptic(cue);
  playUiSound(cue);
};

// Rest alerts retain their independent sound and vibration preferences.
// Browsers cannot set vibration intensity; stronger cues use longer pulse patterns.
export const playRestCountdownSound = (secondsRemaining) => {
  if (!loadSettings().restSound) return;
  // Square waves have a clearer edge than soft sine tones on phone speakers.
  // Keep levels below clipping while making the final countdown hard to miss.
  const volume = secondsRemaining >= 5 ? 0.16 : secondsRemaining === 4 ? 0.22 : 0.28;
  const frequency = secondsRemaining >= 5 ? 660 : secondsRemaining === 4 ? 740 : 880;
  playTones([{ frequency, duration: 0.085, volume, type: 'square' }]);
};

export const playRestCompleteSound = () => {
  if (!loadSettings().restSound) return;
  playTones([
    { frequency: 880, duration: 0.2, volume: 0.28, type: 'triangle' },
    { frequency: 1046, delay: 0.2, duration: 0.22, volume: 0.3, type: 'triangle' },
    { frequency: 660, delay: 0.43, duration: 0.42, volume: 0.32, type: 'triangle' },
  ]);
};

export const vibrate = (pattern = [120, 60, 120]) => {
  if (!loadSettings().restVibration) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Vibration is unavailable on some devices and browsers.
  }
};
