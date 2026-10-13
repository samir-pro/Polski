/* ============================================================================
 * Speech — Polish text-to-speech and (where available) speech recognition,
 * both through the browser's Web Speech API. No audio files needed.
 *
 *  - speak(text)  reads Polish aloud with the best Polish voice available.
 *  - The voice, speed and volume are chosen in Settings and saved per browser.
 *  - listen()     transcribes one Polish utterance for speaking exercises
 *                 (Chrome, Edge, Safari). Resolves with a list of guesses.
 * ========================================================================== */

const Speech = (() => {
  const supported = "speechSynthesis" in window;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  const VKEY = "popolsku.vol.voice";
  const RKEY = "popolsku.rate.voice";
  const NKEY = "popolsku.voice.name";
  const RATE_MIN = 0.5, RATE_MAX = 1.5;

  let volume = parseFloat(store.get(VKEY));
  if (isNaN(volume)) volume = 1;
  let rate = parseFloat(store.get(RKEY));
  if (isNaN(rate)) rate = 0.9;
  let voices = [];
  let voice = null;

  // Higher-quality voices first: neural/online voices sound far more natural.
  const QUALITY = [/natural/i, /online/i, /neural/i, /premium/i, /enhanced/i, /google/i, /zosia|paulina|ewa|maja|agnieszka|marek|jacek/i];
  const score = (v) => {
    let s = v.lang === "pl-PL" ? 10 : 0;
    QUALITY.forEach((re, i) => { if (re.test(v.name)) s += QUALITY.length - i; });
    if (v.localService === false) s += 1;
    return s;
  };

  function loadVoices() {
    if (!supported) return;
    voices = window.speechSynthesis.getVoices()
      .filter((v) => v.lang && v.lang.toLowerCase().replace("_", "-").startsWith("pl"))
      .sort((a, b) => score(b) - score(a));
    const saved = store.get(NKEY);
    voice = voices.find((v) => v.name === saved) || voices[0] || null;
  }

  if (supported) {
    loadVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  }

  // Strip notes and alternatives so "dziś / dzisiaj (today)" reads naturally.
  const clean = (t) => String(t).replace(/\([^)]*\)/g, "").split(" / ")[0].replace(/…/g, "").trim();

  function speak(text, opts = {}) {
    if (!supported || !text || volume <= 0) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean(text));
      u.lang = voice ? voice.lang : "pl-PL";
      u.rate = opts.slow ? Math.max(RATE_MIN, rate * 0.65) : rate;
      u.volume = volume;
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    } catch (e) { /* no-op */ }
  }

  function setVolume(v) { volume = Math.max(0, Math.min(1, v)); store.set(VKEY, String(volume)); }
  function getVolume() { return volume; }
  function setRate(r) {
    rate = Math.round(Math.max(RATE_MIN, Math.min(RATE_MAX, r)) * 10) / 10;
    store.set(RKEY, String(rate));
  }
  function getRate() { return rate; }
  function getVoices() { return voices; }
  function getVoice() { return voice; }
  function setVoice(name) {
    voice = voices.find((v) => v.name === name) || voice;
    if (voice) store.set(NKEY, voice.name);
  }

  // ---- speech recognition ----------------------------------------------------
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canListen = !!Recognition;

  function listen() {
    return new Promise((resolve, reject) => {
      if (!canListen) return reject(new Error("unsupported"));
      const rec = new Recognition();
      rec.lang = "pl-PL";
      rec.interimResults = false;
      rec.maxAlternatives = 5;
      let done = false;
      rec.onresult = (e) => {
        done = true;
        resolve([...e.results[0]].map((alt) => alt.transcript));
      };
      rec.onerror = (e) => { if (!done) { done = true; reject(new Error(e.error || "error")); } };
      rec.onend = () => { if (!done) { done = true; resolve([]); } };
      try { window.speechSynthesis && window.speechSynthesis.cancel(); rec.start(); }
      catch (e) { reject(e); }
    });
  }

  return {
    speak, setVolume, getVolume, setRate, getRate, getVoices, getVoice, setVoice, listen,
    RATE_MIN, RATE_MAX,
    get supported() { return supported; },
    get canListen() { return canListen; }
  };
})();

window.Speech = Speech;
