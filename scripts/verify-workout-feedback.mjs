import assert from 'node:assert/strict';

const values = new Map();
const vibrationCalls = [];
const dispatchedEvents = [];
let oscillatorCount = 0;

globalThis.localStorage = {
  getItem: (key) => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};

class FakeAudioContext {
  state = 'running';
  currentTime = 10;
  destination = {};
  resume() { this.state = 'running'; return Promise.resolve(); }
  createOscillator() {
    oscillatorCount += 1;
    return { type: 'sine', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} };
  }
  createGain() {
    return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
  }
}

globalThis.window = {
  AudioContext: FakeAudioContext,
  dispatchEvent: (event) => { dispatchedEvents.push(event.type); },
};
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { vibrate: (pattern) => { vibrationCalls.push(pattern); return true; } },
});

const { loadSettings, saveSettings } = await import('../src/lib/storage.js');
const { triggerFeedback, playRestCountdownSound, playRestCompleteSound, previewRestCountdownSound, playNotificationSound, previewNotificationSound, COUNTDOWN_SOUNDS, vibrate } = await import('../src/lib/workoutFeedback.js');

assert.equal(loadSettings().interfaceSound, true);
assert.equal(loadSettings().interfaceHaptics, true);
assert.equal(loadSettings().restCountdownSound, 'basic', 'existing users keep the built-in countdown by default');
assert.deepEqual(COUNTDOWN_SOUNDS.map((sound) => sound.id), ['basic', 'race'], 'settings expose both countdown options');

triggerFeedback('setComplete');
assert.deepEqual(vibrationCalls[0], [18, 35, 12]);
assert.equal(oscillatorCount, 2, 'set-complete cue should use two quiet tones');

saveSettings({ ...loadSettings(), interfaceSound: false, interfaceHaptics: false });
assert.ok(dispatchedEvents.includes('califorge:settings-changed'));
triggerFeedback('confirm');
assert.equal(vibrationCalls.length, 1, 'disabled interface haptics must remain silent');
assert.equal(oscillatorCount, 2, 'disabled interface sound must remain silent');

saveSettings({ ...loadSettings(), restSound: false, restVibration: false });
playRestCompleteSound();
vibrate();
assert.equal(vibrationCalls.length, 1, 'rest vibration setting must remain independent');

saveSettings({ ...loadSettings(), restSound: true, restVibration: true });
playRestCompleteSound();
vibrate([120, 60, 120]);
assert.equal(oscillatorCount, 5, 'three-note rest chime should still work when interface sounds are disabled');
assert.deepEqual(vibrationCalls[1], [120, 60, 120], 'rest vibration should still work when interface haptics are disabled');

// Countdown selection: basic plays per-second oscillator beeps, race uses the
// bundled MP3 (no HTMLAudio in Node, so it must stay silent and not crash),
// and previews bypass the restSound master toggle by design.
saveSettings({ ...loadSettings(), restSound: false, restCountdownSound: 'basic' });
playRestCountdownSound(3);
assert.equal(oscillatorCount, 5, 'disabled rest sound must stay silent for countdown ticks');
previewRestCountdownSound('basic');
assert.equal(oscillatorCount, 8, 'basic preview plays its three demo beeps even when rest sound is off');

saveSettings({ ...loadSettings(), restSound: true, restCountdownSound: 'race' });
playRestCountdownSound(5);
playRestCountdownSound(4);
playRestCountdownSound(3);
assert.equal(oscillatorCount, 8, 'race countdown uses the MP3 file, not oscillator beeps');
playRestCompleteSound();
assert.equal(oscillatorCount, 8, 'race "go" beep replaces the extra rest-over chime');
previewRestCountdownSound('race');
assert.equal(oscillatorCount, 8, 'race preview uses the MP3 file without crashing');

saveSettings({ ...loadSettings(), restSound: true, restCountdownSound: 'basic' });

// Session-reminder notification sound: gated by the notifications setting,
// preview bypasses it; both use the MP3 file (silent in Node, no crash).
saveSettings({ ...loadSettings(), notifications: false });
playNotificationSound();
previewNotificationSound();
saveSettings({ ...loadSettings(), notifications: true });
playNotificationSound();
assert.equal(oscillatorCount, 8, 'notification sound uses the MP3 file, not oscillator tones');

console.log('APEX workout feedback checks passed.');
