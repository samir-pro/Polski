/* ============================================================================
 * Sounds — synthesized UI feedback via the Web Audio API.
 * No audio files: taps, correct/wrong chimes and a level-up flourish are all
 * generated as short tones. Volume is user-controlled and saved.
 * ========================================================================== */

const Sound = (() => {
  const KEY = "popolsku.vol.fx";
  let ctx = null;
  let vol = parseFloat(localStorage.getItem(KEY));
  if (isNaN(vol)) vol = 0.6; // 0..1

  // Lazily create / resume the AudioContext (must follow a user gesture).
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = "sine", when = 0, gainMul = 1) {
    const c = ensure();
    if (!c || vol <= 0) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    const peak = Math.max(0.0001, vol * gainMul * 0.4);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  // ---- the sound palette ---------------------------------------------------
  function tap()     { tone(220, 0.05, "triangle", 0, 0.5); }
  function correct() { tone(660, 0.10, "sine", 0, 1); tone(990, 0.13, "sine", 0.09, 0.9); }
  function wrong()   { tone(200, 0.18, "sawtooth", 0, 0.7); tone(150, 0.20, "sawtooth", 0.07, 0.6); }
  function complete(){ [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "sine", i * 0.11, 0.9)); }
  function levelup() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, "triangle", i * 0.10, 1)); }

  function setVolume(v) {
    vol = Math.max(0, Math.min(1, v));
    localStorage.setItem(KEY, String(vol));
  }
  function getVolume() { return vol; }

  return { tap, correct, wrong, complete, levelup, setVolume, getVolume, ensure };
})();

window.Sound = Sound;
