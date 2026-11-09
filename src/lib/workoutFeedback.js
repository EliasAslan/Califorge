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
    notes.forEach(({ frequency, delay = 0, duration = 0.07, volume = 0.03, type = 'sine' }) => {
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

// Selectable rest-countdown cues. 'basic' is the built-in synthesized beep
// sequence; 'race' plays the race-start MP3 (short beeps + long "go" beep,
// ~3s total) starting at 3 seconds remaining so the "go" lands on 0.
export const COUNTDOWN_SOUNDS = [
  {
    id: 'basic',
    label: 'Classic beeps',
    description: 'Built-in escalating beeps for the final 5 seconds, then a chime when rest ends.',
  },
  {
    id: 'race',
    label: 'Race start beeps',
    description: 'Race-style short beeps with a long "go" beep in the final 3 seconds. The "go" replaces the rest-over chime.',
  },
];

export const RACE_BEEPS_URL = '/sounds/race-start-beeps.mp3';
export const NOTIFICATION_URL = '/sounds/notification.mp3';

const getCountdownSoundId = () => {
  const id = loadSettings().restCountdownSound;
  return COUNTDOWN_SOUNDS.some((sound) => sound.id === id) ? id : 'basic';
};

// Plays a bundled MP3 file. Returns silently where HTML audio is unavailable
// (e.g. Node-based verification scripts) or playback is blocked.
const fileAudioCache = new Map();
const playFileSound = (url) => {
  try {
    const AudioCtor = typeof window !== 'undefined' ? window.Audio : undefined;
    if (!AudioCtor) return;
    let audio = fileAudioCache.get(url);
    if (!audio) {
      audio = new AudioCtor(url);
      audio.preload = 'auto';
      fileAudioCache.set(url, audio);
    }
    audio.currentTime = 0;
    const result = audio.play();
    result?.catch?.(() => {});
  } catch {
    // Audio is an enhancement; unsupported or blocked audio stays silent.
  }
};

export const playRestCountdownSound = (secondsRemaining) => {
  if (!loadSettings().restSound) return;
  if (getCountdownSoundId() === 'race') {
    // One full race-start sequence covers 3-2-1-go; tick beeps are skipped.
    if (secondsRemaining === 3) playFileSound(RACE_BEEPS_URL);
    return;
  }
  // Square waves have a clearer edge than soft sine tones on phone speakers.
  // Keep levels below clipping while making the final countdown hard to miss.
  const volume = secondsRemaining >= 5 ? 0.16 : secondsRemaining === 4 ? 0.22 : 0.28;
  const frequency = secondsRemaining >= 5 ? 660 : secondsRemaining === 4 ? 740 : 880;
  playTones([{ frequency, duration: 0.085, volume, type: 'square' }]);
};

// Audition a countdown cue without touching the restSound master toggle, so
// users can compare options in Settings before committing to one.
export const previewRestCountdownSound = (soundId) => {
  const id = COUNTDOWN_SOUNDS.some((sound) => sound.id === soundId) ? soundId : getCountdownSoundId();
  if (id === 'race') {
    playFileSound(RACE_BEEPS_URL);
    return;
  }
  // Short demo of the escalating final ticks (5/4/3 compressed to ~1s).
  playTones([
    { frequency: 660, duration: 0.085, volume: 0.16, type: 'square' },
    { frequency: 740, delay: 0.3, duration: 0.085, volume: 0.22, type: 'square' },
    { frequency: 880, delay: 0.6, duration: 0.085, volume: 0.28, type: 'square' },
  ]);
};

// Notification sound for the planned-session reminder. Gated by the
// "Workout notifications" setting; the OS notification itself uses the
// system sound, while this MP3 plays when the app is open.
export const playNotificationSound = () => {
  if (!loadSettings().notifications) return;
  playFileSound(NOTIFICATION_URL);
};

// Audition the reminder sound from Settings, bypassing the toggle.
export const previewNotificationSound = () => {
  playFileSound(NOTIFICATION_URL);
};

export const playRestCompleteSound = () => {
  if (!loadSettings().restSound) return;
  // The race-start file ends with its own long "go" beep at 0, so the extra
  // chime would double the signal. Vibration still fires from the callers.
  if (getCountdownSoundId() === 'race') return;
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
