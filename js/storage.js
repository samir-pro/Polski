/* ============================================================================
 * Storage — all user progress lives in the browser via localStorage.
 *
 * The user can close the navigator and come back later: progress persists,
 * they continue where they left off, and future milestones stay locked until
 * earned. No account or backend required.
 *
 * A progress object looks like:
 * {
 *   name: "Samir",
 *   currentLevel: "A1",
 *   completed: { "A0": [1,2,...,31], "A1": [1,2] },   // completed step numbers
 *   best:      { "A0-7": 0.9 },                        // best score per step (0..1)
 *   examPassed:{ "A0": true },                         // level validated?
 *   xp: 1240,
 *   streak: { count: 5, last: "2026-06-19" },
 *   srs: { "dom": { due: "2026-06-21", box: 2 } },    // spaced repetition
 *   updatedAt: 1718000000000
 * }
 * ========================================================================== */

const Storage = (() => {
  const KEY = "popolsku.progress.v1";

  const blank = () => ({
    name: "",
    currentLevel: "A0",
    completed: {},
    best: {},
    examPassed: {},
    xp: 0,
    streak: { count: 0, last: null },
    srs: {},
    updatedAt: Date.now()
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const parsed = JSON.parse(raw);
      return Object.assign(blank(), parsed);
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

  // ---- Streak handling -----------------------------------------------------
  function touchStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const last = state.streak.last;
    if (last === today) return; // already counted today
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    state.streak.count = last === yesterday ? state.streak.count + 1 : 1;
    state.streak.last = today;
    save();
  }

  // ---- Step completion -----------------------------------------------------
  function isStepUnlocked(levelId, stepN) {
    const levelIdx = COURSE.levels.findIndex((l) => l.id === levelId);
    if (levelIdx === -1) return false;

    // First level, first step is always open.
    if (levelIdx === 0 && stepN === 1) return true;

    // A level is unlocked only if the previous level's exam was passed.
    if (levelIdx > 0) {
      const prev = COURSE.levels[levelIdx - 1].id;
      if (!state.examPassed[prev] && stepN === 1) return false;
      if (!state.examPassed[prev]) return false;
    }

    if (stepN === 1) return true;

    // Subsequent steps unlock when the previous step in the level is completed.
    const done = state.completed[levelId] || [];
    return done.includes(stepN - 1);
  }

  function isStepCompleted(levelId, stepN) {
    return (state.completed[levelId] || []).includes(stepN);
  }

  function completeStep(levelId, stepN, score, opts = {}) {
    const preview = !!opts.preview;
    const isExam = stepN === STEPS_PER_LEVEL;
    const passed = isExam ? score >= PASS_THRESHOLD : true;

    // What gets saved:
    //  - A regular lesson opened in PREVIEW (locked) is NOT saved — overview only.
    //  - An exam is saved only when PASSED (the validation / test-out path),
    //    whether reached normally or previewed while locked.
    //  - A regular, properly-unlocked lesson is saved.
    const willSave = isExam ? passed : !preview;
    if (!willSave) {
      return { isExam, passed, saved: false };
    }

    if (isExam && passed) {
      // Validate this level AND back-fill every previous level, so advanced
      // learners who test out aren't forced to grind earlier content. Back-filled
      // steps are marked complete but keep a rating of 0 until actually practiced.
      validateUpTo(levelId);
      state.xp += 10 + Math.round(score * 10);
    } else {
      if (!state.completed[levelId]) state.completed[levelId] = [];
      if (!state.completed[levelId].includes(stepN)) {
        state.completed[levelId].push(stepN);
        state.completed[levelId].sort((a, b) => a - b);
      }
      const key = `${levelId}-${stepN}`;
      state.best[key] = Math.max(state.best[key] || 0, score);
      state.xp += 10 + Math.round(score * 10);
    }

    touchStreak();
    save();
    return { isExam, passed, saved: true };
  }

  // Mark every level up to and including `levelId` as validated, unlocking all
  // their lessons. Ratings default to 0 (never lowering an existing score).
  function validateUpTo(levelId) {
    const idx = COURSE.levels.findIndex((l) => l.id === levelId);
    for (let i = 0; i <= idx; i++) {
      const lv = COURSE.levels[i];
      state.examPassed[lv.id] = true;
      if (!state.completed[lv.id]) state.completed[lv.id] = [];
      for (let n = 1; n <= STEPS_PER_LEVEL; n++) {
        if (!state.completed[lv.id].includes(n)) state.completed[lv.id].push(n);
        const key = `${lv.id}-${n}`;
        if (state.best[key] == null) state.best[key] = 0; // rating stays 0
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

  function isLevelUnlocked(levelId) {
    const idx = COURSE.levels.findIndex((l) => l.id === levelId);
    if (idx === 0) return true;
    return !!state.examPassed[COURSE.levels[idx - 1].id];
  }

  // ---- Spaced repetition (Leitner-style) -----------------------------------
  function scheduleSrs(word, correct) {
    const entry = state.srs[word] || { box: 1, due: null };
    entry.box = correct ? Math.min(entry.box + 1, 5) : 1;
    const days = [0, 1, 2, 4, 7, 15][entry.box]; // box -> interval
    entry.due = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    state.srs[word] = entry;
    save();
  }

  function dueReviews() {
    const today = new Date().toISOString().slice(0, 10);
    return Object.entries(state.srs)
      .filter(([, v]) => v.due && v.due <= today)
      .map(([w]) => w);
  }

  // ---- Export / Import (manual backup, move between devices) ----------------
  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    state = Object.assign(blank(), parsed);
    save();
    return state;
  }

  function reset() {
    state = blank();
    save();
  }

  return {
    get, setName,
    isStepUnlocked, isStepCompleted, completeStep,
    levelProgress, isLevelUnlocked,
    scheduleSrs, dueReviews,
    exportJSON, importJSON, reset
  };
})();

window.Storage = Storage;
