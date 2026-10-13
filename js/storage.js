/* ============================================================================
 * Storage — all user progress lives in the browser via localStorage.
 *
 * Close the tab and come back later: progress persists, you continue where you
 * left off, and future steps stay locked until earned. No account or backend.
 *
 * A progress object looks like:
 * {
 *   v: 1,
 *   name: "Samir",
 *   currentLevel: "A1",
 *   completed: { "A0": [1,2,...,31], "A1": [1,2] },   // completed step numbers
 *   best:      { "A0-7": 0.9 },                        // best score per step (0..1)
 *   examPassed:{ "A0": true },                         // level validated?
 *   xp: 1240,
 *   xpLog: { "2026-10-13": 35 },                       // XP earned per local day
 *   streak: { count: 5, last: "2026-10-13" },
 *   srs: { "dom": { due: "2026-10-15", box: 2, seen: 4, wrong: 1 } },
 *   last: { levelId: "A1", stepN: 3 },                 // "continue" shortcut
 *   settings: { dailyGoal: 30, speaking: true },
 *   updatedAt: 1718000000000
 * }
 * ========================================================================== */

const Storage = (() => {
  const KEY = "popolsku.progress.v1";
  const DAY = 86400000;

  const blank = () => ({
    v: 1,
    name: "",
    currentLevel: "A0",
    completed: {},
    best: {},
    examPassed: {},
    xp: 0,
    xpLog: {},
    streak: { count: 0, last: null },
    srs: {},
    last: null,
    settings: { dailyGoal: 30, speaking: true },
    updatedAt: Date.now()
  });

  // Dates are the learner's LOCAL calendar day, not UTC — otherwise a lesson
  // done at 00:30 could count for "yesterday" and break the streak.
  const dayKey = (t = Date.now()) => {
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const today = () => dayKey();

  function merge(parsed) {
    const b = blank();
    const s = Object.assign(b, parsed && typeof parsed === "object" ? parsed : {});
    s.settings = Object.assign(blank().settings, s.settings || {});
    s.streak = Object.assign({ count: 0, last: null }, s.streak || {});
    ["completed", "best", "examPassed", "xpLog", "srs"].forEach((k) => {
      if (!s[k] || typeof s[k] !== "object" || Array.isArray(s[k])) s[k] = {};
    });
    if (typeof s.xp !== "number" || !isFinite(s.xp)) s.xp = 0;
    return s;
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? merge(JSON.parse(raw)) : blank();
    } catch (e) {
      return blank();
    }
  }

  function save() {
    state.updatedAt = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save progress:", e);
    }
  }

  function get() { return state; }
  function setName(name) { state.name = name; save(); }
  function getSetting(k) { return state.settings[k]; }
  function setSetting(k, v) { state.settings[k] = v; save(); }
  function setLast(levelId, stepN) { state.last = { levelId, stepN }; save(); }

  // ---- XP, daily goal & streak ---------------------------------------------
  function touchStreak() {
    const t = today();
    const last = state.streak.last;
    if (last === t) return;
    const yesterday = dayKey(Date.now() - DAY);
    state.streak.count = last === yesterday ? state.streak.count + 1 : 1;
    state.streak.last = t;
  }

  // A streak that missed a day reads as 0 until the learner practises again.
  function currentStreak() {
    const last = state.streak.last;
    return last === today() || last === dayKey(Date.now() - DAY) ? state.streak.count : 0;
  }

  function addXp(n) {
    state.xp += n;
    const t = today();
    state.xpLog[t] = (state.xpLog[t] || 0) + n;
    // Keep the log small: only the last 60 days.
    const cutoff = dayKey(Date.now() - 60 * DAY);
    Object.keys(state.xpLog).forEach((d) => { if (d < cutoff) delete state.xpLog[d]; });
    touchStreak();
    save();
  }

  function todayXp() { return state.xpLog[today()] || 0; }

  // XP for the last n days, oldest first: [{ day: "2026-10-13", xp: 20 }, …]
  function week(n = 7) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = dayKey(Date.now() - i * DAY);
      out.push({ day: d, xp: state.xpLog[d] || 0 });
    }
    return out;
  }

  // ---- Step completion -----------------------------------------------------
  const levelIndex = (id) => COURSE.levels.findIndex((l) => l.id === id);

  function isLevelUnlocked(levelId) {
    const idx = levelIndex(levelId);
    if (idx <= 0) return idx === 0;
    return !!state.examPassed[COURSE.levels[idx - 1].id];
  }

  function isStepUnlocked(levelId, stepN) {
    if (!isLevelUnlocked(levelId)) return false;
    if (stepN === 1) return true;
    return (state.completed[levelId] || []).includes(stepN - 1);
  }

  function isStepCompleted(levelId, stepN) {
    return (state.completed[levelId] || []).includes(stepN);
  }

  const xpFor = (score) => 10 + Math.round(score * 10);

  function completeStep(levelId, stepN, score, opts = {}) {
    const preview = !!opts.preview;
    const isExam = stepN === STEPS_PER_LEVEL;
    const passed = isExam ? score >= PASS_THRESHOLD : true;

    // What gets saved:
    //  - A regular lesson opened in PREVIEW (locked) is NOT saved — overview only.
    //  - An exam is saved only when PASSED (the validation / test-out path),
    //    whether reached normally or previewed while locked.
    //  - A regular, properly unlocked lesson is saved.
    const willSave = isExam ? passed : !preview;
    if (!willSave) return { isExam, passed, saved: false, xp: 0 };

    if (isExam) {
      // Validate this level AND back-fill every previous level, so learners
      // who test out aren't forced to grind earlier content. Back-filled steps
      // are marked complete but keep a rating of 0 until actually practised.
      validateUpTo(levelId);
      const key = `${levelId}-${stepN}`;
      state.best[key] = Math.max(state.best[key] || 0, score);
    } else {
      if (!state.completed[levelId]) state.completed[levelId] = [];
      if (!state.completed[levelId].includes(stepN)) {
        state.completed[levelId].push(stepN);
        state.completed[levelId].sort((a, b) => a - b);
      }
      const key = `${levelId}-${stepN}`;
      state.best[key] = Math.max(state.best[key] || 0, score);
    }
    const xp = xpFor(score) + (isExam ? 20 : 0);
    addXp(xp);
    return { isExam, passed, saved: true, xp };
  }

  function validateUpTo(levelId) {
    const idx = levelIndex(levelId);
    for (let i = 0; i <= idx; i++) {
      const lv = COURSE.levels[i];
      state.examPassed[lv.id] = true;
      if (!state.completed[lv.id]) state.completed[lv.id] = [];
      for (let n = 1; n <= STEPS_PER_LEVEL; n++) {
        if (!state.completed[lv.id].includes(n)) state.completed[lv.id].push(n);
        const key = `${lv.id}-${n}`;
        if (state.best[key] == null) state.best[key] = 0;
      }
      state.completed[lv.id].sort((a, b) => a - b);
    }
    const next = COURSE.levels[idx + 1];
    state.currentLevel = next ? next.id : levelId;
  }

  function levelProgress(levelId) {
    const done = (state.completed[levelId] || []).length;
    return { done, total: STEPS_PER_LEVEL, pct: Math.round((done / STEPS_PER_LEVEL) * 100) };
  }

  // First unlocked-but-unfinished step across the course (for "Continue").
  function nextStep() {
    for (const lv of COURSE.levels) {
      if (!isLevelUnlocked(lv.id)) break;
      for (let n = 1; n <= STEPS_PER_LEVEL; n++) {
        if (!isStepCompleted(lv.id, n)) return { levelId: lv.id, stepN: n };
      }
    }
    return null;
  }

  // ---- Spaced repetition (Leitner boxes) -------------------------------------
  const INTERVALS = [0, 1, 2, 4, 7, 15, 30]; // box -> days until next review

  function scheduleSrs(word, correct) {
    if (!word) return;
    const e = state.srs[word] || { box: 0, due: null, seen: 0, wrong: 0 };
    e.seen = (e.seen || 0) + 1;
    if (correct) {
      e.box = Math.min((e.box || 0) + 1, INTERVALS.length - 1);
    } else {
      e.box = 1;
      e.wrong = (e.wrong || 0) + 1;
    }
    e.due = dayKey(Date.now() + INTERVALS[e.box] * DAY);
    state.srs[word] = e;
    save();
  }

  function dueReviews() {
    const t = today();
    return Object.entries(state.srs)
      .filter(([, v]) => v.due && v.due <= t)
      .sort((a, b) => (a[1].box - b[1].box) || ((b[1].wrong || 0) - (a[1].wrong || 0)))
      .map(([w]) => w);
  }

  // Words missed most often relative to how often they were seen.
  function weakWords(n = 20) {
    return Object.entries(state.srs)
      .filter(([, v]) => (v.wrong || 0) > 0)
      .sort((a, b) => (b[1].wrong / b[1].seen) - (a[1].wrong / a[1].seen) || b[1].wrong - a[1].wrong)
      .slice(0, n)
      .map(([w]) => w);
  }

  function srsInfo(word) { return state.srs[word] || null; }

  function srsStats() {
    const all = Object.values(state.srs);
    return {
      learned: all.length,
      mastered: all.filter((v) => v.box >= 5).length,
      due: dueReviews().length
    };
  }

  // ---- Export / Import (manual backup, move between devices) ----------------
  function exportJSON() { return JSON.stringify(state, null, 2); }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || !("completed" in parsed) || !("xp" in parsed)) {
      throw new Error("Not a Po Polsku! progress file");
    }
    state = merge(parsed);
    save();
    return state;
  }

  function reset() { state = blank(); save(); }

  return {
    get, setName, getSetting, setSetting, setLast,
    isStepUnlocked, isStepCompleted, completeStep, levelProgress, isLevelUnlocked, nextStep,
    addXp, todayXp, week, currentStreak,
    scheduleSrs, dueReviews, weakWords, srsInfo, srsStats,
    exportJSON, importJSON, reset, today
  };
})();

window.Storage = Storage;
