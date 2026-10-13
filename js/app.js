/* ============================================================================
 * App — screens, hash routing and the lesson player.
 * Vanilla JS, no framework, no build step. Renders into #app.
 *
 * Routes:  #/            home (level map, daily goal, review)
 *          #/level/A1    the 31-step path of a level
 *          #/lesson/A1/5 lesson player (step 31 = validation exam)
 *          #/review/due  spaced-repetition review (also: weak, mixed)
 *          #/guide  #/grammar  #/words  #/settings
 * ========================================================================== */

(() => {
  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");
  const S = window.Speech;

  // ---- theme (light / medium / dark) --------------------------------------
  const Theme = (() => {
    const KEY = "popolsku.theme";
    const ORDER = ["light", "medium", "dark"];
    const META = {
      light:  { icon: "☀️", label: "Light",  color: "#c8102e" },
      medium: { icon: "🌗", label: "Medium", color: "#242a36" },
      dark:   { icon: "🌙", label: "Dark",   color: "#14171f" }
    };
    const get = () => document.documentElement.getAttribute("data-theme") || "light";
    function set(t) {
      if (!META[t]) t = "light";
      document.documentElement.setAttribute("data-theme", t);
      try { localStorage.setItem(KEY, t); } catch (e) {}
      const tag = document.querySelector('meta[name="theme-color"]');
      if (tag) tag.setAttribute("content", META[t].color);
    }
    function cycle() {
      const next = ORDER[(ORDER.indexOf(get()) + 1) % ORDER.length];
      set(next);
      return next;
    }
    return { get, set, cycle, META, ORDER };
  })();

  // ---- tiny helpers --------------------------------------------------------
  const el = (tag, attrs = {}, children = []) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v === true ? "" : v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null || c === false) return;
      n.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    });
    // A soft tap on every button press (pointerdown also unlocks the audio
    // context on the first user gesture). Opt out with data-snd="off".
    if (tag === "button" && attrs["data-snd"] !== "off") {
      n.addEventListener("pointerdown", () => window.Sound && Sound.tap());
    }
    return n;
  };
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

  // Polish text as safe HTML (one helper so every screen formats it the same way).
  const plHtml = (pl) => esc(pl);

  const sayBtn = (text, opts = {}) => S.supported
    ? el("button", { class: "audio-btn" + (opts.big ? "" : " small"), "data-say": text, "aria-label": "Listen",
        title: "Listen", onclick: (e) => { e.stopPropagation(); S.speak(text); } }, "🔊")
    : null;
  const slowBtn = (text) => S.supported
    ? el("button", { class: "audio-btn small slow", "aria-label": "Listen slowly", title: "Listen slowly",
        "data-say-slow": text, onclick: (e) => { e.stopPropagation(); S.speak(text, { slow: true }); } }, "🐢")
    : null;

  let toastTimer;
  function toast(msg, kind = "") {
    toastEl.textContent = msg;
    toastEl.className = "toast show " + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.className = "toast"), 1900);
  }

  const levelById = (id) => COURSE.levels.find((l) => l.id === id);
  const lessonTitle = (level, n) => (n === STEPS_PER_LEVEL ? "Validation Exam" : level.lessons[n - 1].title);

  // ---- routing ---------------------------------------------------------------
  let session = null; // the running lesson / review, if any

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function render() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    const [page, a, b] = parts;
    session = null;
    window.scrollTo(0, 0);
    if (page === "level" && levelById(a)) return routeLevel(a);
    if (page === "lesson" && levelById(a) && +b >= 1 && +b <= STEPS_PER_LEVEL) return routeLesson(a, +b);
    if (page === "review") return routeReview(a || "due");
    if (page === "guide") return routeGuide();
    if (page === "grammar") return routeGrammar();
    if (page === "words") return routeWords();
    if (page === "settings") return routeSettings();
    return routeHome();
  }

  // ---- top bar -------------------------------------------------------------
  function topBar(back) {
    const left = back
      ? el("button", { class: "icon-btn", onclick: () => go(back), "aria-label": "Back" }, "←")
      : el("a", { class: "brand", href: "#/" }, [el("span", { class: "brand-flag", "aria-hidden": "true" }), "Po Polsku!"]);
    const themeBtn = el("button", {
      class: "icon-btn themed", "aria-label": "Toggle theme", title: "Theme: " + Theme.META[Theme.get()].label
    }, Theme.META[Theme.get()].icon);
    themeBtn.addEventListener("click", () => {
      const next = Theme.cycle();
      themeBtn.textContent = Theme.META[next].icon;
      themeBtn.title = "Theme: " + Theme.META[next].label;
      toast(Theme.META[next].label + " theme " + Theme.META[next].icon);
    });
    const s = Storage.get();
    return el("header", { class: "topbar" }, [left, el("div", { class: "stats" }, [
      el("span", { class: "stat", title: "Experience points" }, `⭐ ${s.xp}`),
      el("span", { class: "stat", title: "Day streak" }, `🔥 ${Storage.currentStreak()}`),
      themeBtn,
      el("a", { class: "icon-btn", href: "#/settings", "aria-label": "Settings", title: "Settings" }, "⚙️")
    ])]);
  }

  function footer() {
    return el("footer", { class: "foot muted" }, [
      "Progress is saved in this browser. ",
      el("a", { href: "#/settings" }, "Back up / move devices")
    ]);
  }

  // ========================================================================
  // HOME
  // ========================================================================
  function routeHome() {
    const s = Storage.get();
    clear(app);
    app.appendChild(topBar(null));

    app.appendChild(el("section", { class: "hero" }, [
      el("h1", {}, s.name ? `Cześć, ${s.name}! 👋` : "Uczmy się polskiego!"),
      el("p", { class: "muted" }, "Polish from zero (A0) to mastery (C2) — everyday words and phrases for living and studying in Poland. 31 steps per level; step 31 validates the level.")
    ]));

    app.appendChild(goalCard());

    const next = Storage.nextStep();
    if (next) {
      const lv = levelById(next.levelId);
      app.appendChild(el("a", { class: "continue-card", href: `#/lesson/${next.levelId}/${next.stepN}`, style: `--accent:${lv.color}` }, [
        el("div", { class: "continue-ico" }, next.stepN === STEPS_PER_LEVEL ? "🏆" : "▶"),
        el("div", { class: "level-info" }, [
          el("div", { class: "kicker" }, `${next.stepN === 1 && next.levelId === "A0" && !s.xp ? "Start here" : "Continue"} · ${next.levelId} step ${next.stepN}`),
          el("div", { class: "level-name" }, lessonTitle(lv, next.stepN))
        ]),
        el("div", { class: "level-status" }, "→")
      ]));
    }

    const stats = Storage.srsStats();
    if (stats.due) {
      app.appendChild(el("a", { class: "review-banner", href: "#/review/due" }, [
        el("span", {}, `🔁 ${plural(stats.due, "word")} to review today`),
        el("span", { class: "review-go" }, "Review →")
      ]));
    } else if (stats.learned >= 8) {
      app.appendChild(el("a", { class: "review-banner calm", href: "#/review/mixed" }, [
        el("span", {}, "✅ No reviews due. Fancy a quick practice?"),
        el("span", { class: "review-go" }, "Practice →")
      ]));
    }

    app.appendChild(el("div", { class: "tool-grid" }, [
      toolCard("#/guide", "🧭", "Life in Poland", "Residence card, PESEL, bank, doctor, housing…"),
      toolCard("#/grammar", "📐", "Grammar", "Cases, verbs, word order — cheat sheets"),
      toolCard("#/words", "📖", "Dictionary", `${Exercises.index().size} words & phrases, with audio`)
    ]));

    const grid = el("div", { class: "level-grid" });
    COURSE.levels.forEach((level) => {
      const unlocked = Storage.isLevelUnlocked(level.id);
      const prog = Storage.levelProgress(level.id);
      const passed = s.examPassed[level.id];
      grid.appendChild(el("a", {
        class: "level-card" + (unlocked ? "" : " locked"), style: `--accent:${level.color}`, href: `#/level/${level.id}`
      }, [
        el("div", { class: "level-badge" }, level.id),
        el("div", { class: "level-info" }, [
          el("div", { class: "level-name" }, level.name.split("·")[1]?.trim() || level.name),
          el("div", { class: "level-blurb muted" }, level.blurb),
          el("div", { class: "progress" }, [el("div", { class: "progress-bar", style: `width:${prog.pct}%` })]),
          el("div", { class: "level-meta muted" }, `${prog.done}/${prog.total} steps${passed ? " · ✅ validated" : (unlocked ? "" : " · 🔒 preview or test out")}`)
        ]),
        el("div", { class: "level-status" }, unlocked ? (passed ? "✅" : "▶") : "🔒")
      ]));
    });
    app.appendChild(grid);
    app.appendChild(footer());
  }

  function toolCard(href, ico, title, sub) {
    return el("a", { class: "tool-card", href }, [
      el("div", { class: "tool-ico" }, ico),
      el("div", { class: "tool-title" }, title),
      el("div", { class: "tool-sub muted" }, sub)
    ]);
  }

  // Daily goal ring, streak and a 7-day activity strip.
  function goalCard() {
    const goal = Storage.getSetting("dailyGoal") || 30;
    const xp = Storage.todayXp();
    const pct = Math.min(100, Math.round((xp / goal) * 100));
    const week = Storage.week(7);
    const max = Math.max(goal, ...week.map((d) => d.xp));
    const dayNames = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];
    const stats = Storage.srsStats();
    return el("section", { class: "goal-card card" }, [
      el("div", { class: "goal-ring", style: `--p:${pct}` }, [el("span", { class: "goal-num" }, pct >= 100 ? "✓" : `${xp}`)]),
      el("div", { class: "goal-info" }, [
        el("div", { class: "goal-title" }, pct >= 100 ? "Daily goal reached! 🎉" : `Today: ${xp} / ${goal} XP`),
        el("div", { class: "muted small" }, `🔥 ${plural(Storage.currentStreak(), "day")} streak · 📚 ${stats.learned} words practised · 🏅 ${stats.mastered} mastered`),
        el("div", { class: "week" }, week.map((d) => {
          const [y, m, dd] = d.day.split("-").map(Number);
          const name = dayNames[new Date(y, m - 1, dd).getDay()];
          return el("div", { class: "week-day", title: `${d.day}: ${d.xp} XP` }, [
            el("div", { class: "week-bar" }, [el("div", { class: "week-fill" + (d.xp >= goal ? " hit" : ""), style: `height:${Math.round((d.xp / max) * 100)}%` })]),
            el("div", { class: "week-name muted" }, name)
          ]);
        }))
      ])
    ]);
  }

  // ========================================================================
  // LEVEL — the 31-step path
  // ========================================================================
  function routeLevel(levelId) {
    const level = levelById(levelId);
    clear(app);
    app.appendChild(topBar("#/"));

    const levelUnlocked = Storage.isLevelUnlocked(levelId);
    app.appendChild(el("section", { class: "level-head", style: `--accent:${level.color}` }, [
      el("h2", {}, level.name),
      el("p", { class: "muted" }, level.blurb)
    ]));

    if (!levelUnlocked) {
      app.appendChild(el("div", { class: "review-banner static" }, [
        el("span", {}, "👁 Preview mode — this level is locked. Explore any lesson (scores aren't saved), or pass the Validation Exam (step 31) to test out: it unlocks this and all earlier levels.")
      ]));
    }

    const path = el("div", { class: "path" });
    const s = Storage.get();
    for (let n = 1; n <= STEPS_PER_LEVEL; n++) {
      const isExam = n === STEPS_PER_LEVEL;
      const unlocked = Storage.isStepUnlocked(levelId, n);
      const done = Storage.isStepCompleted(levelId, n);
      const best = s.best[`${levelId}-${n}`];
      const stars = done && best != null ? (best >= 0.95 ? "★★★" : best >= 0.8 ? "★★☆" : best > 0 ? "★☆☆" : "☆☆☆") : "";
      const side = n % 2 === 0 ? "right" : "left";
      path.appendChild(el("div", { class: `path-row ${side}` }, [
        el("a", {
          class: "node" + (done ? " done" : "") + (unlocked ? "" : " locked") + (isExam ? " exam" : ""),
          style: `--accent:${level.color}`, href: `#/lesson/${levelId}/${n}`,
          title: unlocked ? lessonTitle(level, n) : lessonTitle(level, n) + " (preview — not saved)"
        }, done ? "✓" : (isExam ? "🏆" : (unlocked ? String(n) : "🔒"))),
        el("div", { class: "node-label" }, [
          el("div", { class: "node-step muted" }, [
            (isExam ? "Step 31 · Exam" : `Step ${n}`) + (unlocked ? "" : " · 👁 preview"),
            stars ? el("span", { class: "stars", title: `Best: ${Math.round(best * 100)}%` }, stars) : null
          ]),
          el("div", { class: "node-title" }, lessonTitle(level, n))
        ])
      ]));
    }
    app.appendChild(path);
  }

  // ========================================================================
  // LESSON PLAYER
  // ========================================================================
  const exerciseOpts = () => ({
    audio: S.supported,
    speaking: S.canListen && Storage.getSetting("speaking") !== false
  });

  function newSession(extra) {
    return Object.assign({
      idx: 0, correct: 0, answered: 0, mistakes: [],
      // review history: frozen copies of answered questions, by item index
      snaps: [], liveIdx: 0, liveBody: null, liveAnswered: false, view: null
    }, extra);
  }

  function routeLesson(levelId, stepN) {
    const level = levelById(levelId);
    const isExam = stepN === STEPS_PER_LEVEL;
    const lesson = isExam ? null : level.lessons[stepN - 1];
    const items = isExam ? Exercises.buildExam(level, exerciseOpts()) : Exercises.buildLesson(level, lesson, exerciseOpts());
    const preview = !Storage.isStepUnlocked(levelId, stepN);
    if (!preview) Storage.setLast(levelId, stepN);
    session = newSession({ levelId, stepN, isExam, level, lesson, items, preview, color: level.color, exitTo: `#/level/${levelId}` });
    if (isExam) renderExamIntro(session);
    else renderTip(session);
  }

  function routeReview(kind) {
    let words, title;
    if (kind === "weak") { words = Storage.weakWords(15); title = "Tricky words"; }
    else if (kind === "mixed") {
      words = Exercises.shuffle(Object.keys(Storage.get().srs)).slice(0, 12);
      title = "Quick practice";
    } else { words = Storage.dueReviews(); title = "Daily review"; }
    const items = Exercises.buildReview(words, exerciseOpts());
    clear(app);
    if (!items.length) {
      app.appendChild(topBar("#/"));
      app.appendChild(el("div", { class: "card empty" }, [
        el("div", { class: "result-emoji" }, "🌱"),
        el("h2", {}, "Nothing to review yet"),
        el("p", { class: "muted" }, "Words you practise in lessons come back here on a spaced-repetition schedule — just before you'd forget them."),
        el("a", { class: "btn primary big", href: "#/" }, "Go to lessons")
      ]));
      return;
    }
    session = newSession({ isReview: true, reviewKind: kind, title, items, color: "#c8102e", exitTo: "#/" });
    nextItem(session);
  }

  function progressHeader(session) {
    const pct = Math.round((session.idx / session.items.length) * 100);
    return el("div", { class: "lesson-top" }, [
      el("button", { class: "icon-btn", onclick: () => confirmQuit(session), "aria-label": "Close" }, "✕"),
      el("div", { class: "progress slim", style: `--accent:${session.color}` }, [el("div", { class: "progress-bar", style: `width:${pct}%` })]),
      session.preview ? el("span", { class: "stat preview-chip", title: "Preview — not saved" }, "👁") : null,
      S.supported ? speedChip() : null,
      el("span", { class: "stat" }, `${session.isExam ? "📝 " : session.isReview ? "🔁 " : ""}${session.idx}/${session.items.length}`)
    ]);
  }

  // Quick voice-speed toggle shown during lessons (also adjustable in Settings).
  const SPEED_STEPS = [0.6, 0.8, 0.9, 1, 1.2];
  const speedLabel = () => (S.getRate() < 0.85 ? "🐢 " : "🗣️ ") + S.getRate().toFixed(1) + "×";
  function speedChip() {
    const b = el("button", { class: "stat speed-chip", title: "Voice speed — tap to change", "aria-label": "Voice speed" }, speedLabel());
    b.addEventListener("click", () => {
      const cur = S.getRate();
      S.setRate(SPEED_STEPS.find((r) => r > cur + 0.001) ?? SPEED_STEPS[0]);
      b.textContent = speedLabel();
      S.speak("Dzień dobry");
    });
    return b;
  }

  function confirmQuit(session) {
    if (session.answered === 0 || confirm("Leave now? Progress on this step won't be saved.")) go(session.exitTo);
  }

  // Grammar / culture tip card shown before a lesson.
  function renderTip(session) {
    clear(app);
    app.appendChild(el("div", { class: "player" }, [
      el("div", { class: "lesson-top" }, [
        el("button", { class: "icon-btn", onclick: () => go(session.exitTo), "aria-label": "Close" }, "✕"),
        el("span", { class: "stat" }, `${session.levelId} · Step ${session.stepN}`)
      ]),
      el("div", { class: "card tip-card", style: `--accent:${session.color}` }, [
        el("div", { class: "kicker" }, session.level.id + " · Lesson " + session.stepN),
        el("h2", {}, session.lesson.title),
        session.preview ? el("div", { class: "preview-note" }, "👁 Preview — this lesson is locked, so your score won't be saved. Explore freely!") : null,
        el("div", { class: "tip", html: "💡 " + session.lesson.tip }),
        el("div", { class: "tip-words" }, session.lesson.vocab.map((v) => el("span", { class: "chip" }, v[0]))),
        el("button", { class: "btn primary big", "data-primary": "", onclick: () => nextItem(session) }, session.preview ? "Preview →" : "Start →")
      ])
    ]));
  }

  function renderExamIntro(session) {
    clear(app);
    app.appendChild(el("div", { class: "player" }, [
      el("div", { class: "lesson-top" }, [
        el("button", { class: "icon-btn", onclick: () => go(session.exitTo), "aria-label": "Close" }, "✕"),
        el("span", { class: "stat" }, "🏆 Exam")
      ]),
      el("div", { class: "card tip-card exam-card", style: `--accent:${session.color}` }, [
        el("div", { class: "kicker" }, session.level.id + " · Validation Exam"),
        el("h2", {}, "Step 31 — Validate " + session.level.id),
        session.preview ? el("div", { class: "preview-note" }, "🚀 Test out! This level is locked, but if you pass this exam it counts: you'll validate " + session.level.id + " and unlock every earlier level. A failed attempt won't be saved.") : null,
        el("p", {}, `${session.items.length} mixed questions drawn from the whole level — vocabulary, der/die/das, sentences and word order. No hints.`),
        el("p", { class: "muted" }, `You need ${Math.round(PASS_THRESHOLD * 100)}% to pass and unlock the next level.`),
        el("button", { class: "btn primary big", "data-primary": "", onclick: () => nextItem(session) }, "Begin exam →")
      ])
    ]));
  }

  const RENDERERS = {
    flashcard: renderFlashcard, choice: renderChoice, listening: renderListening, match: renderMatch,
    fill: renderFill, translate: renderTranslate, build: renderBuild,
    dictation: renderDictation, speak: renderSpeak
  };

  function nextItem(session) {
    // Freeze the question we're leaving so it can be reviewed later.
    if (session.liveBody && session.liveAnswered) session.snaps[session.liveIdx] = freeze(session.liveBody);
    session.liveBody = null;
    session.liveAnswered = false;
    session.view = null;
    if (session.idx >= session.items.length) return finish(session);
    session.liveIdx = session.idx;
    const item = session.items[session.idx];
    (RENDERERS[item.type] || renderChoice)(session, item);
  }

  // Record an answer and advance the index.
  function record(session, correct, word, mistake) {
    session.answered++;
    if (correct) session.correct++;
    else if (mistake) session.mistakes.push(mistake);
    // Previews of locked lessons are look-only: they never feed the review queue.
    if (word && !session.preview && Exercises.index().has(word)) Storage.scheduleSrs(word, correct);
    session.idx++;
    session.liveAnswered = true;
  }
  // Move on without scoring (e.g. a skipped speaking exercise).
  function skip(session) {
    session.idx++;
    session.liveAnswered = true;
  }

  // A read-only copy of an answered exercise: every control is disabled and the
  // Continue button removed, so a past answer can be seen but not changed.
  // Audio buttons keep working.
  function freeze(node) {
    const copy = node.cloneNode(true);
    const srcInputs = node.querySelectorAll("input, textarea");
    copy.querySelectorAll("input, textarea").forEach((inp, i) => {
      inp.value = srcInputs[i] ? srcInputs[i].value : inp.value;
      inp.setAttribute("value", inp.value);
      inp.readOnly = true;
      inp.disabled = true;
    });
    copy.querySelectorAll(".feedback .btn, .pl-keys, .exercise > .btn, .speak-actions").forEach((b) => b.remove());
    copy.querySelectorAll("button").forEach((b) => {
      if (!b.hasAttribute("data-say") && !b.hasAttribute("data-say-slow")) b.disabled = true;
    });
    copy.addEventListener("click", (e) => {
      const t = e.target.closest("[data-say], [data-say-slow]");
      if (!t) return;
      if (t.hasAttribute("data-say")) S.speak(t.getAttribute("data-say"));
      else S.speak(t.getAttribute("data-say-slow"), { slow: true });
    });
    return copy;
  }

  // Previous / Next bar. "Next" never goes beyond the latest question reached.
  function navBar(session) {
    const shown = session.view ?? session.liveIdx;
    const canPrev = shown > 0 && !!session.snaps[shown - 1];
    const canNext = session.view != null;
    return el("div", { class: "nav-bar" }, [
      el("button", { class: "btn nav-btn", disabled: !canPrev, onclick: () => goTo(session, shown - 1) }, "← Previous"),
      session.view != null
        ? el("span", { class: "nav-note" }, `👁 Q${session.view + 1} · read-only`)
        : el("span", { class: "nav-note muted" }, `Question ${session.liveIdx + 1}`),
      el("button", { class: "btn nav-btn", disabled: !canNext, onclick: () => goTo(session, shown + 1) },
        session.view != null && shown + 1 === session.liveIdx ? "Latest →" : "Next →")
    ]);
  }

  function goTo(session, i) {
    if (i < 0 || i > session.liveIdx) return;
    if (session.view == null && session.liveAnswered) session.snaps[session.liveIdx] = freeze(session.liveBody);
    if (i === session.liveIdx) {
      session.view = null;
      renderFrame(session, session.liveBody);
    } else if (session.snaps[i]) {
      session.view = i;
      renderFrame(session, session.snaps[i]);
    }
  }

  function renderFrame(session, node) {
    clear(app);
    app.appendChild(el("div", { class: "player" + (session.view != null ? " reviewing" : "") },
      [progressHeader(session), navBar(session), node]));
  }

  function shell(session, body) {
    session.liveBody = body;
    session.view = null;
    renderFrame(session, body);
  }

  function feedbackBar(ok, correctNode, onNext, note) {
    return el("div", { class: "feedback " + (ok ? "ok" : "no"), role: "status" }, [
      el("div", { class: "feedback-text" }, [
        ok ? el("div", {}, "✓ " + praise()) : el("div", {}, ["✗ ", correctNode]),
        ok && correctNode ? el("div", { class: "feedback-sub" }, correctNode) : null,
        note ? el("div", { class: "feedback-note" }, note) : null
      ]),
      el("button", { class: "btn primary", "data-continue": "", onclick: onNext }, "Continue →")
    ]);
  }
  const PRAISE = ["Dobrze!", "Świetnie!", "Brawo!", "Super!", "Doskonale!", "Bardzo dobrze!", "Tak jest!", "Ekstra!"];
  const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

  const NOTES = {
    umlaut: (ans) => `Mind the umlauts: ${ans}`,
    article: (ans) => `Don't forget the article: ${ans}`,
    typo: (ans) => `Small typo — exact spelling: ${ans}`
  };
  const noteFor = (detail, ans) => (NOTES[detail] ? NOTES[detail](ans) : null);

  // On-screen Polish letters for learners without a Polish keyboard layout.
  function plKeyboard(input) {
    const wrap = el("div", { class: "pl-keys", "aria-label": "Polish letters" });
    "ąćęłńóśźż".split("").forEach((ch) => {
      const b = el("button", { class: "pl-key", type: "button", "data-snd": "off" }, ch);
      // mousedown/preventDefault keeps focus (and the caret) in the input.
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", () => {
        if (input.disabled) return;
        const st = input.selectionStart ?? input.value.length;
        const en = input.selectionEnd ?? input.value.length;
        input.value = input.value.slice(0, st) + ch + input.value.slice(en);
        input.focus();
        input.setSelectionRange(st + 1, st + 1);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  const textInput = (placeholder) => el("input", { class: "text-input", type: "text", autocomplete: "off",
    autocapitalize: "off", autocorrect: "off", spellcheck: "false", lang: "pl", placeholder });

  // ---- exercise renderers --------------------------------------------------

  function renderFlashcard(session, item) {
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, "New word"),
      el("div", { class: "card flash", style: `--accent:${session.color}` }, [
        el("div", { class: "flash-pl" }, item.pl),
        el("div", { class: "audio-row" }, [sayBtn(item.pl, { big: true }), slowBtn(item.pl)]),
        el("div", { class: "flash-en muted" }, item.en),
      ]),
      el("button", { class: "btn primary big", "data-primary": "", onclick: () => { record(session, true); nextItem(session); } }, "Got it →")
    ]);
    shell(session, body);
    if (S.supported) setTimeout(() => S.speak(item.pl), 250);
  }

  // Shared by choice, listening and article: a list of option buttons.
  function optionList(session, body, options, isCorrect, onAnswered, labelOf = (o) => o) {
    const opts = el("div", { class: "options" });
    options.forEach((opt, i) => {
      const b = el("button", { class: "option", "data-key": String(i + 1) }, [
        el("span", { class: "opt-key" }, String(i + 1)), el("span", { class: "opt-label", html: labelOf(opt) })
      ]);
      b.addEventListener("click", () => {
        const ok = isCorrect(opt);
        if (window.Sound) (ok ? Sound.correct() : Sound.wrong());
        [...opts.children].forEach((c) => (c.disabled = true));
        b.classList.add(ok ? "correct" : "wrong");
        if (!ok) [...opts.children].forEach((c, j) => { if (isCorrect(options[j])) c.classList.add("correct"); });
        onAnswered(ok);
      });
      opts.appendChild(b);
    });
    body.appendChild(opts);
    return opts;
  }

  function renderChoice(session, item) {
    const plEn = item.mode === "pl-en";
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, plEn ? "What does this mean?" : "How do you say this in Polish?"),
      el("div", { class: "prompt" }, [
        el("span", {}, item.prompt),
        plEn ? sayBtn(item.prompt) : null
      ])
    ]);
    optionList(session, body, item.options, (o) => o === item.answer, (ok) => {
      const pl = plEn ? item.prompt : item.answer;
      const en = plEn ? item.answer : item.prompt;
      record(session, ok, item.word, `${pl} = ${en}`);
      if (!plEn) S.speak(pl);
      body.appendChild(feedbackBar(ok, el("span", {}, `${pl} = ${en}`), () => nextItem(session)));
    }, esc);
    shell(session, body);
    if (plEn && S.supported) setTimeout(() => S.speak(item.prompt), 250);
  }

  function renderListening(session, item) {
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, "Listen and choose the meaning"),
      el("div", { class: "listen-row" }, [
        el("button", { class: "card listen-big", "data-say": item.pl, onclick: () => S.speak(item.pl) }, "🔊 Tap to listen"),
        el("button", { class: "card listen-slow", "data-say-slow": item.pl, onclick: () => S.speak(item.pl, { slow: true }), "aria-label": "Listen slowly" }, "🐢")
      ])
    ]);
    optionList(session, body, item.options, (o) => o === item.answer, (ok) => {
      record(session, ok, item.word, `${item.pl} = ${item.answer}`);
      body.appendChild(feedbackBar(ok, el("span", {}, `${item.pl} = ${item.answer}`), () => nextItem(session)));
    }, esc);
    shell(session, body);
    if (S.supported) setTimeout(() => S.speak(item.pl), 300);
  }

  function renderMatch(session, item) {
    const left = Exercises.shuffle(item.pairs);
    const right = Exercises.shuffle(item.pairs);
    let selected = null, matched = 0, misses = 0;
    const colL = el("div", { class: "match-col" });
    const colR = el("div", { class: "match-col" });
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, "Match the pairs"),
      el("div", { class: "match" }, [colL, colR])
    ]);
    const clearSel = () => { if (selected) selected.el.classList.remove("sel"); selected = null; };
    // Select from either column first, then tap its partner in the other one.
    function pick(side, p, b) {
      if (b.disabled) return;
      if (side === "pl") S.speak(p.pl);
      if (!selected || selected.side === side) {
        clearSel(); selected = { side, p, el: b }; b.classList.add("sel");
        return;
      }
      if (selected.p.pl === p.pl) {
        if (window.Sound) Sound.correct();
        [b, selected.el].forEach((x) => { x.classList.remove("sel"); x.classList.add("correct"); x.disabled = true; });
        selected = null;
        if (++matched === item.pairs.length) {
          if (window.Sound) Sound.complete();
          record(session, misses <= 1);
          body.appendChild(feedbackBar(true, null, () => nextItem(session), misses ? `${plural(misses, "mismatch")} on the way` : null));
        }
      } else {
        misses++;
        if (window.Sound) Sound.wrong();
        const other = selected.el;
        [b, other].forEach((x) => x.classList.add("wrong"));
        setTimeout(() => [b, other].forEach((x) => x.classList.remove("wrong")), 600);
        clearSel();
      }
    }
    left.forEach((p) => { const b = el("button", { class: "option match-pl" }, p.pl); b.addEventListener("click", () => pick("pl", p, b)); colL.appendChild(b); });
    right.forEach((p) => { const b = el("button", { class: "option" }, p.en); b.addEventListener("click", () => pick("en", p, b)); colR.appendChild(b); });
    shell(session, body);
  }

  // Shared by fill / translate / dictation: an input with a Check button.
  function typedExercise(session, { kicker, top, placeholder, answer, typos = true, word, mistake, sayAfter, correctNode }) {
    const input = textInput(placeholder);
    const body = el("div", { class: "exercise" }, [el("div", { class: "ex-kicker muted" }, kicker), ...top, input, plKeyboard(input)]);
    let done = false;
    const submit = () => {
      if (done || !input.value.trim()) return;
      done = true;
      const detail = Exercises.checkTypedDetail(input.value, answer, { typos });
      const ok = !!detail;
      if (window.Sound) (ok ? Sound.correct() : Sound.wrong());
      input.disabled = true;
      input.classList.add(ok ? "correct" : "wrong");
      record(session, ok, word, mistake);
      const fb = feedbackBar(ok, correctNode, () => nextItem(session), ok ? noteFor(detail, answer.split(" / ")[0]) : null);
      if (S.supported && sayAfter) {
        fb.firstChild.prepend(sayBtn(sayAfter));
        S.speak(sayAfter);
      }
      body.appendChild(fb);
    };
    body.appendChild(el("button", { class: "btn primary", onclick: submit }, "Check"));
    shell(session, body);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    setTimeout(() => input.focus(), 60);
  }

  function renderFill(session, item) {
    typedExercise(session, {
      kicker: "Fill in the blank",
      top: [
        el("div", { class: "card sentence" }, [el("span", {}, item.sentence), sayBtn(item.full)]),
        el("div", { class: "muted translation" }, item.translation)
      ],
      placeholder: "Type the missing word",
      answer: item.answer, typos: false, word: item.answer,
      mistake: item.full, sayAfter: item.full,
      correctNode: el("span", {}, item.full)
    });
  }

  function renderTranslate(session, item) {
    typedExercise(session, {
      kicker: "Translate into Polish",
      top: [el("div", { class: "card sentence" }, item.en)],
      placeholder: "Type in Polish",
      answer: item.pl, word: item.word,
      mistake: `${item.en} = ${item.pl}`, sayAfter: item.pl,
      correctNode: el("span", {}, `${item.en} → ${item.pl}`)
    });
  }

  function renderDictation(session, item) {
    typedExercise(session, {
      kicker: "Listen and type what you hear",
      top: [el("div", { class: "listen-row" }, [
        el("button", { class: "card listen-big", "data-say": item.pl, onclick: () => S.speak(item.pl) }, "🔊 Play sentence"),
        el("button", { class: "card listen-slow", "data-say-slow": item.pl, onclick: () => S.speak(item.pl, { slow: true }), "aria-label": "Play slowly" }, "🐢")
      ])],
      placeholder: "Type the Polish sentence",
      answer: item.pl, mistake: `${item.pl} (${item.en})`,
      correctNode: el("span", {}, [item.pl, el("span", { class: "muted" }, ` — ${item.en}`)])
    });
    setTimeout(() => S.speak(item.pl), 350);
  }

  function renderBuild(session, item) {
    const answerZone = el("div", { class: "build-answer", "aria-label": "Your sentence" });
    const bank = el("div", { class: "build-bank" });
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, "Build the sentence in Polish"),
      el("div", { class: "card sentence" }, item.en),
      answerZone, bank
    ]);
    let done = false;
    item.tiles.forEach((w) => {
      const tile = el("button", { class: "tile", type: "button" }, w);
      tile.addEventListener("click", () => {
        if (done) return;
        (tile.parentNode === bank ? answerZone : bank).appendChild(tile);
      });
      bank.appendChild(tile);
    });
    const check = el("button", { class: "btn primary", onclick: () => {
      if (done || !answerZone.children.length) return;
      done = true;
      const built = [...answerZone.children].map((t) => t.textContent).join(" ");
      const ok = Exercises.normalize(built) === Exercises.normalize(item.answer.join(" "));
      if (window.Sound) (ok ? Sound.correct() : Sound.wrong());
      answerZone.classList.add(ok ? "correct" : "wrong");
      [...body.querySelectorAll(".tile")].forEach((t) => (t.disabled = true));
      record(session, ok, null, `${item.pl} (${item.en})`);
      const fb = feedbackBar(ok, el("span", {}, item.pl), () => nextItem(session));
      if (S.supported) fb.firstChild.prepend(sayBtn(item.pl));
      S.speak(item.pl);
      body.appendChild(fb);
    }}, "Check");
    body.appendChild(check);
    shell(session, body);
  }

  function renderSpeak(session, item) {
    const status = el("div", { class: "speak-status muted" }, "Tap the microphone and read the sentence aloud.");
    const mic = el("button", { class: "mic-btn", "aria-label": "Speak" }, "🎤");
    const actions = el("div", { class: "speak-actions" }, [
      el("button", { class: "btn ghost", onclick: () => { skip(session); nextItem(session); } }, "Can't speak now — skip")
    ]);
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, "Say it aloud"),
      el("div", { class: "card sentence" }, [el("span", {}, item.pl), sayBtn(item.pl), slowBtn(item.pl)]),
      el("div", { class: "muted translation" }, item.en),
      mic, status, actions
    ]);
    let attempts = 0, busy = false, finished = false;
    const conclude = (ok, heard) => {
      finished = true;
      mic.disabled = true;
      actions.remove();
      if (window.Sound) (ok ? Sound.correct() : Sound.wrong());
      record(session, ok, null, `🎤 ${item.pl}`);
      body.appendChild(feedbackBar(ok, el("span", {}, item.pl), () => nextItem(session), heard ? `I heard: “${heard}”` : null));
    };
    mic.addEventListener("click", async () => {
      if (busy || finished) return;
      busy = true;
      mic.classList.add("listening");
      status.textContent = "Listening… 👂";
      try {
        const guesses = await S.listen();
        attempts++;
        const best = guesses.map((g) => ({ g, s: Exercises.similarity(g, item.pl) })).sort((a, b) => b.s - a.s)[0];
        if (best && best.s >= 0.8) conclude(true, best.g);
        else if (attempts >= 2) conclude(false, best ? best.g : "");
        else status.textContent = best ? `I heard “${best.g}”. Try once more!` : "I didn't catch that. Try once more!";
      } catch (e) {
        status.textContent = e.message === "not-allowed"
          ? "Microphone blocked. Allow it in the browser, or turn speaking exercises off in Settings."
          : "Speech recognition isn't available right now — you can skip this one.";
      } finally {
        busy = false;
        mic.classList.remove("listening");
      }
    });
    shell(session, body);
  }

  // ========================================================================
  // RESULTS
  // ========================================================================
  function finish(session) {
    const score = session.answered ? session.correct / session.answered : 0;
    const pctRaw = Math.round(score * 100);
    clear(app);

    if (session.isReview) {
      const xp = 5 + session.correct;
      Storage.addXp(xp);
      if (window.Sound) Sound.complete();
      const card = el("div", { class: "card result", style: `--accent:${session.color}` }, [
        el("div", { class: "result-emoji" }, score >= 0.8 ? "🧠" : "💪"),
        el("h2", {}, session.title + " done!"),
        scoreRing(pctRaw),
        el("div", { class: "result-stats muted" }, `${session.correct} / ${session.answered} correct · +${xp} XP`),
        el("p", { class: "muted" }, "Words you got right come back later; the ones you missed come back tomorrow.")
      ]);
      appendMistakes(card, session);
      card.appendChild(el("div", { class: "result-actions" }, [
        Storage.srsStats().due ? el("a", { class: "btn primary big", href: "#/review/due" }, "Keep reviewing →") : null,
        el("a", { class: "btn ghost", href: "#/" }, "Home")
      ]));
      app.appendChild(el("div", { class: "player center" }, [card]));
      return;
    }

    const res = Storage.completeStep(session.levelId, session.stepN, score, { preview: session.preview });
    const levelIdx = COURSE.levels.findIndex((l) => l.id === session.levelId);
    const passedExam = res.isExam && res.passed;
    const failedExam = res.isExam && !res.passed;
    const previewLesson = !res.isExam && !res.saved;

    if (window.Sound) {
      if (passedExam) Sound.levelup();
      else if (failedExam || score < 0.5) Sound.wrong();
      else Sound.complete();
    }
    if (passedExam) confetti();

    const emoji = passedExam ? "🏆" : failedExam ? "💪" : previewLesson ? "👁"
      : score >= 0.9 ? "🌟" : score >= 0.7 ? "🎉" : "👍";
    const title = passedExam ? "Level validated!"
      : failedExam ? (session.preview ? "Preview complete" : "Almost there!")
      : previewLesson ? "Overview complete" : "Step complete!";

    const actions = el("div", { class: "result-actions" });
    if (passedExam) {
      const nextLevel = COURSE.levels[levelIdx + 1];
      if (nextLevel) actions.appendChild(el("a", { class: "btn primary big", href: `#/level/${nextLevel.id}` }, `Start ${nextLevel.id} →`));
      actions.appendChild(el("a", { class: "btn ghost", href: "#/" }, "Home"));
    } else if (failedExam) {
      actions.appendChild(el("button", { class: "btn primary big", "data-primary": "", onclick: () => go(`#/lesson/${session.levelId}/${session.stepN}`) }, "Retry exam"));
      if (session.preview) actions.appendChild(el("a", { class: "btn", href: `#/level/${session.levelId}` }, "Study this level first"));
      actions.appendChild(el("a", { class: "btn ghost", href: `#/level/${session.levelId}` }, "Back to path"));
    } else {
      const nextStep = session.stepN + 1;
      if (nextStep <= STEPS_PER_LEVEL) actions.appendChild(el("button", { class: "btn primary big", "data-primary": "", onclick: () => go(`#/lesson/${session.levelId}/${nextStep}`) }, "Next step →"));
      if (score < 0.8) actions.appendChild(el("button", { class: "btn", onclick: () => go(`#/lesson/${session.levelId}/${session.stepN}`) }, "↻ Practise again"));
      actions.appendChild(el("a", { class: "btn ghost", href: `#/level/${session.levelId}` }, "Back to path"));
    }

    const goal = Storage.getSetting("dailyGoal") || 30;
    const today = Storage.todayXp();
    const statsLine = res.saved
      ? `${session.correct} / ${session.answered} correct · +${res.xp} XP · today ${today}/${goal} XP`
      : `${session.correct} / ${session.answered} correct · 👁 Preview — not saved`;

    const card = el("div", { class: "card result", style: `--accent:${session.color}` }, [
      el("div", { class: "result-emoji" }, emoji),
      el("h2", {}, title),
      scoreRing(pctRaw),
      el("div", { class: "result-stats muted" }, statsLine),
      res.saved && today >= goal && today - res.xp < goal ? el("p", { class: "goal-hit" }, "🎯 Daily goal reached — great work!") : null,
      passedExam && levelIdx > 0 ? el("p", { class: "muted" }, "All earlier levels are now unlocked (rated 0 stars) — replay any lesson to earn a real score.") : null,
      failedExam ? el("p", { class: "muted" }, `You need ${Math.round(PASS_THRESHOLD * 100)}% to pass.` + (session.preview ? " This attempt wasn't saved." : " Review and try again — dasz radę!")) : null,
      previewLesson ? el("p", { class: "muted" }, "This lesson is locked, so your score wasn't saved. Pass the level's exam (step 31) to unlock it for real.") : null
    ]);
    appendMistakes(card, session);
    card.appendChild(actions);
    app.appendChild(el("div", { class: "player center" }, [card]));
  }

  const scoreRing = (pct) => el("div", { class: "score-ring", style: `--p:${pct}` }, [el("span", { class: "score-num" }, pct + "%")]);

  function appendMistakes(card, session) {
    if (!session.mistakes.length) return;
    const m = el("details", { class: "mistakes" }, [el("summary", {}, `Review ${plural(session.mistakes.length, "item")} to revisit`)]);
    session.mistakes.slice(0, 15).forEach((mk) => m.appendChild(el("div", { class: "mistake-item" }, mk)));
    card.appendChild(m);
  }

  function confetti() {
    const layer = el("div", { class: "confetti", "aria-hidden": "true" });
    const colors = ["#ffffff", "#dc143c", "#ffd700"];
    for (let i = 0; i < 60; i++) {
      layer.appendChild(el("i", { style: `left:${Math.random() * 100}%;background:${colors[i % 3]};animation-delay:${Math.random() * 0.6}s;animation-duration:${1.6 + Math.random() * 1.4}s` }));
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 3500);
  }

  // ========================================================================
  // LIFE IN GERMANY — practical survival guide (always unlocked)
  // ========================================================================
  function routeGuide() {
    clear(app);
    app.appendChild(topBar("#/"));
    app.appendChild(el("section", { class: "level-head", style: "--accent:#c8102e" }, [
      el("h2", {}, "🧭 Life in Poland"),
      el("p", { class: "muted" }, "Practical tips for settling in and managing daily life as an international student. Tap 🔊 to hear any phrase. Rules change — always confirm with the office concerned.")
    ]));
    GUIDE.forEach((sec, i) => {
      const d = el("details", { class: "guide-sec" }, [
        el("summary", {}, [el("span", { class: "guide-sec-ico" }, sec.icon), el("span", {}, sec.title)])
      ]);
      if (i === 0) d.open = true;
      d.appendChild(el("ul", { class: "guide-tips" }, sec.tips.map((t) => el("li", { html: t }))));
      d.appendChild(el("div", { class: "kicker" }, "Key phrases"));
      d.appendChild(el("div", { class: "phrase-list" }, sec.phrases.map(([pl, en]) => phraseRow(pl, en))));
      app.appendChild(d);
    });
    app.appendChild(footer());
  }

  function phraseRow(pl, en, extra) {
    return el("div", { class: "phrase" }, [
      sayBtn(pl),
      el("div", { class: "phrase-txt" }, [el("div", { class: "phrase-pl" }, pl), el("div", { class: "muted small" }, en)]),
      extra || null
    ]);
  }

  // ========================================================================
  // GRAMMAR — cheat sheets
  // ========================================================================
  function routeGrammar() {
    clear(app);
    app.appendChild(topBar("#/"));
    app.appendChild(el("section", { class: "level-head", style: "--accent:#2563eb" }, [
      el("h2", {}, "📐 Grammar"),
      el("p", { class: "muted" }, "Compact cheat sheets for the core of Polish grammar. The lessons explain each point step by step; come back here whenever you need a table.")
    ]));
    GRAMMAR.forEach((g) => {
      const lv = levelById(g.level);
      app.appendChild(el("details", { class: "guide-sec grammar-sec" }, [
        el("summary", {}, [el("span", { class: "lvl-tag", style: `--accent:${lv ? lv.color : "#888"}` }, g.level), el("span", {}, g.title)]),
        el("div", { class: "grammar-body", html: g.html })
      ]));
    });
    app.appendChild(footer());
  }

  // ========================================================================
  // DICTIONARY — every word in the course, searchable
  // ========================================================================
  function routeWords() {
    clear(app);
    app.appendChild(topBar("#/"));
    const all = [...Exercises.index().values()];
    let level = "all", query = "", limit = 120;

    app.appendChild(el("section", { class: "level-head", style: "--accent:#0f766e" }, [
      el("h2", {}, "📖 Dictionary"),
      el("p", { class: "muted" }, `All ${all.length} words and phrases in the course. Type without Polish letters if you like — "zrodlo" finds "źródło".`)
    ]));

    const search = el("input", { class: "text-input", type: "search", placeholder: "Search Polish or English…", "aria-label": "Search", lang: "pl" });
    const chips = el("div", { class: "chip-row" });
    ["all", ...COURSE.levels.map((l) => l.id)].forEach((id) => {
      const c = el("button", { class: "chip" + (id === level ? " active" : "") }, id === "all" ? "All" : id);
      c.addEventListener("click", () => {
        level = id; limit = 120;
        [...chips.children].forEach((x) => x.classList.toggle("active", x === c));
        draw();
      });
      chips.appendChild(c);
    });
    const count = el("div", { class: "muted small" });
    const list = el("div", { class: "phrase-list" });
    const more = el("button", { class: "btn", onclick: () => { limit += 200; draw(); } }, "Show more");
    app.append(search, chips, count, list, more);

    const fold = (s) => Exercises.plain(Exercises.normalize(s));
    const statusOf = (w) => {
      const i = Storage.srsInfo(w);
      if (!i) return null;
      return i.box >= 5 ? el("span", { class: "dot mastered", title: "Mastered" }, "●") : el("span", { class: "dot learning", title: "Learning" }, "●");
    };
    function draw() {
      const q = fold(query);
      const rows = all.filter((e) => (level === "all" || e.levelId === level) && (!q || fold(e.pl).includes(q) || fold(e.en).includes(q)));
      count.textContent = `${rows.length} result${rows.length === 1 ? "" : "s"}`;
      clear(list);
      rows.slice(0, limit).forEach((e) => list.appendChild(phraseRow(e.pl, e.en, el("div", { class: "phrase-meta" }, [
        statusOf(e.pl),
        el("a", { class: "lvl-tag", style: `--accent:${levelById(e.levelId).color}`, href: `#/lesson/${e.levelId}/${e.step}`, title: `${e.levelId} · step ${e.step}` }, e.levelId)
      ]))));
      more.style.display = rows.length > limit ? "" : "none";
    }
    let t;
    search.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { query = search.value; limit = 120; draw(); }, 120); });
    draw();
  }

  // ========================================================================
  // SETTINGS
  // ========================================================================
  function routeSettings() {
    const s = Storage.get();
    clear(app);
    app.appendChild(topBar("#/"));

    const nameInput = el("input", { class: "text-input", type: "text", value: s.name || "", placeholder: "Your name (optional)" });
    nameInput.addEventListener("change", () => { Storage.setName(nameInput.value.trim()); toast("Saved ✓", "ok"); });

    const seg = (options, current, onPick) => {
      const wrap = el("div", { class: "theme-toggle" });
      options.forEach(([value, icon, label]) => {
        const b = el("button", { class: "seg" + (current === value ? " active" : "") }, [el("span", { class: "seg-ico" }, icon), el("span", {}, label)]);
        b.addEventListener("click", () => {
          [...wrap.children].forEach((c) => c.classList.remove("active"));
          b.classList.add("active");
          onPick(value);
        });
        wrap.appendChild(b);
      });
      return wrap;
    };

    const mkSlider = (icon, label, get, onInput, onRelease) => {
      const pct = Math.round(get() * 100);
      const valEl = el("span", { class: "slider-val" }, pct + "%");
      const input = el("input", { class: "slider", type: "range", min: "0", max: "100", step: "5", value: String(pct), "aria-label": label });
      input.addEventListener("input", () => { valEl.textContent = input.value + "%"; onInput(parseInt(input.value, 10) / 100); });
      input.addEventListener("change", () => onRelease(parseInt(input.value, 10) / 100));
      return el("div", { class: "slider-row" }, [el("div", { class: "slider-head" }, [el("span", {}, `${icon} ${label}`), valEl]), input]);
    };

    const speedVal = el("span", { class: "slider-val" }, S.getRate().toFixed(1) + "×");
    const speedInput = el("input", { class: "slider", type: "range", min: String(S.RATE_MIN), max: String(S.RATE_MAX), step: "0.1", value: String(S.getRate()), "aria-label": "Reading voice speed" });
    speedInput.addEventListener("input", () => { S.setRate(parseFloat(speedInput.value)); speedVal.textContent = S.getRate().toFixed(1) + "×"; });
    speedInput.addEventListener("change", () => S.speak("Dzień dobry, jak się masz?"));

    // Voice list fills asynchronously in some browsers.
    const voiceSel = el("select", { class: "text-input select", "aria-label": "Polish voice" });
    const fillVoices = () => {
      clear(voiceSel);
      const vs = S.getVoices();
      if (!vs.length) voiceSel.appendChild(el("option", {}, "Default Polish voice"));
      vs.forEach((v) => voiceSel.appendChild(el("option", { value: v.name, selected: S.getVoice() && S.getVoice().name === v.name }, `${v.name} (${v.lang})`)));
    };
    fillVoices();
    if (S.supported && !S.getVoices().length) setTimeout(fillVoices, 800);
    voiceSel.addEventListener("change", () => { S.setVoice(voiceSel.value); S.speak("Cześć! To mój nowy głos."); });

    const speakingToggle = el("label", { class: "switch-row" }, [
      el("input", { type: "checkbox", checked: Storage.getSetting("speaking") !== false, onchange: (e) => { Storage.setSetting("speaking", e.target.checked); toast(e.target.checked ? "Speaking exercises on 🎤" : "Speaking exercises off"); } }),
      el("span", {}, "🎤 Speaking exercises (uses your microphone)")
    ]);

    const fileInput = el("input", { type: "file", accept: "application/json,.json", class: "visually-hidden" });
    fileInput.addEventListener("change", async () => {
      const f = fileInput.files[0];
      if (!f) return;
      try { Storage.importJSON(await f.text()); toast("Imported ✓", "ok"); go("#/"); }
      catch (e) { toast("That file isn't a valid backup ✗", "no"); }
    });
    const importArea = el("textarea", { class: "text-area", placeholder: "…or paste exported progress JSON here" });

    app.appendChild(el("section", { class: "settings" }, [
      el("h2", {}, "Settings & Backup"),
      el("div", { class: "setting" }, [el("label", {}, "Name"), nameInput]),
      el("div", { class: "setting" }, [
        el("label", {}, "Daily goal"),
        seg([[10, "🌱", "Casual · 10"], [20, "🚶", "Regular · 20"], [30, "🏃", "Serious · 30"], [50, "🔥", "Intense · 50"]],
          Storage.getSetting("dailyGoal") || 30, (v) => { Storage.setSetting("dailyGoal", v); toast(`Goal: ${v} XP a day`, "ok"); }),
        el("p", { class: "muted small" }, "A lesson gives 10–20 XP, a review 5+ XP, a passed exam 30–40 XP.")
      ]),
      el("div", { class: "setting" }, [
        el("label", {}, "Appearance"),
        seg(Theme.ORDER.map((t) => [t, Theme.META[t].icon, Theme.META[t].label]), Theme.get(), (t) => { Theme.set(t); toast(Theme.META[t].label + " theme " + Theme.META[t].icon); })
      ]),
      el("div", { class: "setting" }, [
        el("label", {}, "Sound & Voice"),
        S.supported ? el("div", { class: "slider-row" }, [el("div", { class: "slider-head" }, [el("span", {}, "🗣️ Polish voice")]), voiceSel]) : null,
        mkSlider("🔊", "Reading voice volume", () => S.getVolume(), (v) => S.setVolume(v), (v) => { if (v > 0) S.speak("Cześć! Uczymy się polskiego."); }),
        el("div", { class: "slider-row" }, [
          el("div", { class: "slider-head" }, [el("span", {}, "🐢 Reading voice speed"), speedVal]),
          speedInput,
          el("div", { class: "slider-scale muted small" }, [el("span", {}, "Slow 0.5×"), el("span", {}, "Normal 1×"), el("span", {}, "Fast 1.5×")])
        ]),
        mkSlider("🔔", "Feedback sounds volume", () => Sound.getVolume(), (v) => Sound.setVolume(v), (v) => { if (v > 0) Sound.correct(); }),
        S.canListen ? speakingToggle : el("p", { class: "muted small" }, "🎤 Speaking exercises need speech recognition (Chrome, Edge or Safari)."),
        S.supported ? null : el("p", { class: "muted small" }, "🔇 This browser has no text-to-speech, so listening exercises are skipped.")
      ]),
      el("div", { class: "setting" }, [
        el("label", {}, "Your progress lives in this browser"),
        el("p", { class: "muted small" }, "It persists when you close the tab. To move to another device or browser, export it and import it there."),
        el("div", { class: "row" }, [
          el("button", { class: "btn", onclick: () => {
            const blob = new Blob([Storage.exportJSON()], { type: "application/json" });
            const a = el("a", { href: URL.createObjectURL(blob), download: `popolsku-progress-${Storage.today()}.json` });
            document.body.appendChild(a); a.click(); a.remove();
            toast("Exported ✓", "ok");
          }}, "⬇ Export file"),
          el("button", { class: "btn", onclick: () => {
            if (navigator.clipboard) navigator.clipboard.writeText(Storage.exportJSON()).then(() => toast("Copied ✓", "ok"), () => toast("Copy failed ✗", "no"));
          }}, "📋 Copy"),
          el("button", { class: "btn", onclick: () => fileInput.click() }, "⬆ Import file"),
          fileInput
        ]),
        importArea,
        el("button", { class: "btn", onclick: () => {
          try { Storage.importJSON(importArea.value); toast("Imported ✓", "ok"); go("#/"); }
          catch (e) { toast("Invalid backup ✗", "no"); }
        }}, "Import pasted text")
      ]),
      el("div", { class: "setting danger" }, [
        el("label", {}, "Danger zone"),
        el("button", { class: "btn danger", onclick: () => {
          if (confirm("Erase ALL progress? This cannot be undone.")) { Storage.reset(); toast("Progress reset"); go("#/"); }
        }}, "🗑 Reset all progress")
      ]),
      el("p", { class: "muted small" }, "Keyboard: 1–4 pick an answer · Enter checks / continues · ← → step through answered questions.")
    ]));
  }

  // ---- keyboard shortcuts ----------------------------------------------------
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if (session && session.liveBody) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const btns = app.querySelectorAll(".nav-btn");
        const b = btns[e.key === "ArrowLeft" ? 0 : 1];
        if (b && !b.disabled) { e.preventDefault(); b.click(); }
        return;
      }
      if (session.view != null) return;
    }
    if (e.key === "Enter") {
      const target = app.querySelector("[data-continue]") || app.querySelector("[data-primary]");
      if (target && !target.disabled) { e.preventDefault(); target.click(); }
      return;
    }
    if (/^[1-9]$/.test(e.key)) {
      const opt = app.querySelector(`.options .option[data-key="${e.key}"]:not(:disabled)`);
      if (opt) { e.preventDefault(); opt.click(); }
    }
  });

  // ---- boot ----------------------------------------------------------------
  window.addEventListener("hashchange", render);
  render();

  // Offline support: cache the app so it works without a connection.
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
