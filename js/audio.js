/* ============================================================================
 * Audio — Polish text-to-speech via the browser's Web Speech API.
 * No audio files needed. Gracefully degrades if the browser lacks support.
 * ========================================================================== */

const Audio = (() => {
  const supported = "speechSynthesis" in window;
  const VKEY = "popolsku.vol.voice";
  let polishVoice = null;
  let volume = parseFloat(localStorage.getItem(VKEY));
  if (isNaN(volume)) volume = 1; // 0..1
  const RKEY = "popolsku.rate.voice";
  const RATE_MIN = 0.5, RATE_MAX = 1.5;
  let rate = parseFloat(localStorage.getItem(RKEY));
  if (isNaN(rate)) rate = 0.9; // speaking speed, 1 = normal

  function pickVoice() {
    if (!supported) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer a Polish voice; fall back to anything tagged "pl".
    polishVoice =
      voices.find((v) => v.lang === "pl-PL") ||
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("pl")) ||
      null;
  }

  if (supported) {
    pickVoice();
    // Voices load asynchronously in most browsers.
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }

  function speak(text) {
    if (!supported || !text || volume <= 0) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pl-PL";
      u.rate = rate;
      u.volume = volume;
      if (polishVoice) u.voice = polishVoice;
      window.speechSynthesis.speak(u);
    } catch (e) {
      /* no-op */
    }
  }

  function setVolume(v) { volume = Math.max(0, Math.min(1, v)); localStorage.setItem(VKEY, String(volume)); }
  function getVolume() { return volume; }

  // Speaking speed (0.5× slow … 1.5× fast), saved per browser.
  function setRate(r) {
    rate = Math.round(Math.max(RATE_MIN, Math.min(RATE_MAX, r)) * 10) / 10;
    localStorage.setItem(RKEY, String(rate));
  }
  function getRate() { return rate; }

  return { speak, setVolume, getVolume, setRate, getRate, RATE_MIN, RATE_MAX, get supported() { return supported; } };
})();

window.Audio2 = Audio; // avoid clashing with the built-in Audio constructor
