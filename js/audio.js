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

  function speak(text, rate = 0.9) {
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

  return { speak, setVolume, getVolume, get supported() { return supported; } };
})();

window.Audio2 = Audio; // avoid clashing with the built-in Audio constructor
