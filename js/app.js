/* ============================================================================
 * App — screens, routing and the lesson player.
 * Vanilla JS, no framework. Renders into #app.
 * ========================================================================== */

(() => {
  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");
  const A = window.Audio2;

  // ---- theme (light / medium / dark) --------------------------------------
  const Theme = (() => {
    const KEY = "popolsku.theme";
    const ORDER = ["light", "medium", "dark"];
    const META = {
      light:  { icon: "☀️", label: "Light",  color: "#c8102e" },
      medium: { icon: "🌗", label: "Medium", color: "#242a36" },
      dark:   { icon: "🌙", label: "Dark",   color: "#14171f" }
    };
    function get() {
      return document.documentElement.getAttribute("data-theme") || "light";
    }
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
      else if (v !== null && v !== undefined) n.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    // A soft tap on every button press (pointerdown also unlocks the audio
    // context on the first user gesture). Opt out with data-snd="off".
    if (tag === "button" && attrs["data-snd"] !== "off") {
      n.addEventListener("pointerdown", () => window.Sound && Sound.tap());
    }
    return n;
  };
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

  let toastTimer;
  function toast(msg, kind = "") {
    toastEl.textContent = msg;
    toastEl.className = "toast show " + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.className = "toast"), 1800);
  }

  // ---- top bar -------------------------------------------------------------
  function topBar(onBack) {
    const s = Storage.get();
    const left = onBack
      ? el("button", { class: "icon-btn", onclick: onBack, "aria-label": "Back" }, "←")
      : el("span", { class: "brand", onclick: routeHome }, "Po Polsku! 🇵🇱");
    const themeBtn = el("button", {
      class: "icon-btn themed", "aria-label": "Toggle theme",
      title: "Theme: " + Theme.META[Theme.get()].label
    }, Theme.META[Theme.get()].icon);
    themeBtn.addEventListener("click", () => {
      const next = Theme.cycle();
      themeBtn.textContent = Theme.META[next].icon;
      themeBtn.title = "Theme: " + Theme.META[next].label;
      toast(Theme.META[next].label + " theme " + Theme.META[next].icon);
    });

    const stats = el("div", { class: "stats" }, [
      el("span", { class: "stat", title: "Experience points" }, `⭐ ${s.xp}`),
      el("span", { class: "stat", title: "Day streak" }, `🔥 ${s.streak.count}`),
      themeBtn,
      el("button", { class: "icon-btn", onclick: routeSettings, "aria-label": "Settings" }, "⚙️")
    ]);
    return el("header", { class: "topbar" }, [left, stats]);
  }

  // ========================================================================
  // HOME — the level map
  // ========================================================================
  function routeHome() {
    const s = Storage.get();
    clear(app);
    app.appendChild(topBar(null));

    const hero = el("section", { class: "hero" }, [
      el("h1", {}, s.name ? `Cześć, ${s.name}! 👋` : "Uczmy się polskiego!"),
      el("p", { class: "muted" }, "Learn Polish from zero (A0) to advanced (C1) — everyday words and phrases for living and studying in Poland. 31 steps per level; step 31 validates the level and unlocks the next.")
    ]);
    app.appendChild(hero);

    // Daily review nudge
    const due = Storage.dueReviews();
    if (due.length) {
      app.appendChild(el("div", { class: "review-banner" }, [
        el("span", {}, `🔁 You have ${due.length} word${due.length > 1 ? "s" : ""} to review today.`)
      ]));
    }

    app.appendChild(el("button", { class: "guide-card", onclick: routeGuide }, [
      el("div", { class: "guide-ico" }, "🧭"),
      el("div", { class: "level-info" }, [
        el("div", { class: "level-name" }, "Life in Poland — survival guide"),
        el("div", { class: "level-blurb muted" }, "Residence card, PESEL, bank, transport, doctor, renting, working — practical tips + key phrases with audio. Always open.")
      ]),
      el("div", { class: "level-status" }, "→")
    ]));

    const grid = el("div", { class: "level-grid" });
    COURSE.levels.forEach((level) => {
      const unlocked = Storage.isLevelUnlocked(level.id);
      const prog = Storage.levelProgress(level.id);
      const passed = Storage.get().examPassed[level.id];

      const card = el("button", {
        class: "level-card" + (unlocked ? "" : " locked"),
        style: `--accent:${level.color}`,
        onclick: () => routeLevel(level.id)
      }, [
        el("div", { class: "level-badge" }, level.id),
        el("div", { class: "level-info" }, [
          el("div", { class: "level-name" }, level.name.split("·")[1]?.trim() || level.name),
          el("div", { class: "level-blurb muted" }, level.blurb),
          el("div", { class: "progress" }, [
            el("div", { class: "progress-bar", style: `width:${prog.pct}%` })
          ]),
          el("div", { class: "level-meta muted" }, `${prog.done}/${prog.total} steps${passed ? " · ✅ validated" : (unlocked ? "" : " · 🔒 preview")}`)
        ]),
        el("div", { class: "level-status" }, unlocked ? (passed ? "✅" : "▶") : "🔒")
      ]);
      grid.appendChild(card);
    });
    app.appendChild(grid);
    app.appendChild(footer());
  }

  function footer() {
    return el("footer", { class: "foot muted" }, [
      "Progress is saved in this browser. ",
      el("a", { href: "#", onclick: (e) => { e.preventDefault(); routeSettings(); } }, "Back up / move devices")
    ]);
  }

  // ========================================================================
  // LEVEL — the 31-step path
  // ========================================================================
  function routeLevel(levelId) {
    const level = COURSE.levels.find((l) => l.id === levelId);
    clear(app);
    app.appendChild(topBar(routeHome));

    const levelUnlocked = Storage.isLevelUnlocked(levelId);
    app.appendChild(el("section", { class: "level-head", style: `--accent:${level.color}` }, [
      el("h2", {}, level.name),
      el("p", { class: "muted" }, level.blurb)
    ]));

    if (!levelUnlocked) {
      app.appendChild(el("div", { class: "review-banner" }, [
        el("span", {}, "👁 Preview mode — this level is locked. You can explore any lesson, but scores won't be saved. Pass the Validation Exam (step 31) to test out: it unlocks this and all earlier levels.")
      ]));
    }

    const path = el("div", { class: "path" });
    for (let n = 1; n <= STEPS_PER_LEVEL; n++) {
      const isExam = n === STEPS_PER_LEVEL;
      const unlocked = Storage.isStepUnlocked(levelId, n);
      const done = Storage.isStepCompleted(levelId, n);
      const lesson = isExam ? { title: "Validation Exam" } : level.lessons[n - 1];

      const side = n % 2 === 0 ? "right" : "left";
      const node = el("div", { class: `path-row ${side}` }, [
        el("button", {
          // Locked nodes stay clickable (preview), shown with the locked style.
          class: "node" + (done ? " done" : "") + (unlocked ? "" : " locked") + (isExam ? " exam" : ""),
          style: `--accent:${level.color}`,
          onclick: () => routeLesson(levelId, n),
          title: unlocked ? lesson.title : lesson.title + " (preview — not saved)"
        }, done ? "✓" : (isExam ? "🏆" : (unlocked ? String(n) : "🔒"))),
        el("div", { class: "node-label" }, [
          el("div", { class: "node-step muted" }, (isExam ? "Step 31 · Exam" : `Step ${n}`) + (unlocked ? "" : " · 👁 preview")),
          el("div", { class: "node-title" }, lesson.title)
        ])
      ]);
      path.appendChild(node);
    }
    app.appendChild(path);
  }

  // ========================================================================
  // LESSON PLAYER
  // ========================================================================
  function routeLesson(levelId, stepN) {
    const level = COURSE.levels.find((l) => l.id === levelId);
    const isExam = stepN === STEPS_PER_LEVEL;
    const lesson = isExam ? null : level.lessons[stepN - 1];
    const items = isExam ? Exercises.buildExam(level) : Exercises.buildLesson(level, lesson);
    const preview = !Storage.isStepUnlocked(levelId, stepN);

    const session = {
      levelId, stepN, isExam, level, lesson, items, preview,
      idx: 0, correct: 0, answered: 0, mistakes: []
    };

    if (isExam) {
      renderExamIntro(session);
    } else {
      renderTip(session);
    }
  }

  function progressHeader(session) {
    const pct = Math.round((session.idx / session.items.length) * 100);
    return el("div", { class: "lesson-top" }, [
      el("button", { class: "icon-btn", onclick: () => confirmQuit(session.levelId), "aria-label": "Close" }, "✕"),
      el("div", { class: "progress slim" }, [el("div", { class: "progress-bar", style: `width:${pct}%` })]),
      session.preview ? el("span", { class: "stat preview-chip", title: "Preview — not saved" }, "👁") : null,
      el("span", { class: "stat" }, session.isExam ? `📝 ${session.idx}/${session.items.length}` : `${session.idx}/${session.items.length}`)
    ]);
  }

  function confirmQuit(levelId) {
    if (confirm("Leave this step? Your progress on it won't be saved.")) routeLevel(levelId);
  }

  // Grammar tip card shown before a lesson.
  function renderTip(session) {
    clear(app);
    app.appendChild(el("div", { class: "player" }, [
      el("div", { class: "lesson-top" }, [
        el("button", { class: "icon-btn", onclick: () => routeLevel(session.levelId), "aria-label": "Close" }, "✕"),
        el("span", { class: "stat" }, `Step ${session.stepN}`)
      ]),
      el("div", { class: "card tip-card", style: `--accent:${session.level.color}` }, [
        el("div", { class: "kicker" }, session.level.id + " · Lesson"),
        el("h2", {}, session.lesson.title),
        session.preview ? el("div", { class: "preview-note" }, "👁 Preview — this lesson is locked, so your score won't be saved. Explore freely!") : null,
        el("div", { class: "tip", html: "💡 " + session.lesson.tip }),
        el("button", { class: "btn primary big", onclick: () => nextItem(session) }, session.preview ? "Preview →" : "Start →")
      ])
    ]));
  }

  function renderExamIntro(session) {
    clear(app);
    app.appendChild(el("div", { class: "player" }, [
      el("div", { class: "lesson-top" }, [
        el("button", { class: "icon-btn", onclick: () => routeLevel(session.levelId), "aria-label": "Close" }, "✕"),
        el("span", { class: "stat" }, "🏆 Exam")
      ]),
      el("div", { class: "card tip-card exam-card", style: `--accent:${session.level.color}` }, [
        el("div", { class: "kicker" }, session.level.id + " · Validation Exam"),
        el("h2", {}, "Step 31 — Validate " + session.level.id),
        session.preview ? el("div", { class: "preview-note" }, "🚀 Test out! This level is locked, but if you pass this exam it counts: you'll validate " + session.level.id + " and unlock every earlier level. A failed attempt won't be saved.") : null,
        el("p", {}, `Answer ${session.items.length} mixed questions drawn from the whole level. No hints.`),
        el("p", { class: "muted" }, `You need ${Math.round(PASS_THRESHOLD * 100)}% to pass and unlock the next level.`),
        el("button", { class: "btn primary big", onclick: () => nextItem(session) }, "Begin exam →")
      ])
    ]));
  }

  function nextItem(session) {
    if (session.idx >= session.items.length) return finish(session);
    const item = session.items[session.idx];
    const renderers = {
      flashcard: renderFlashcard, choice: renderChoice, listening: renderListening,
      match: renderMatch, fill: renderFill, translate: renderTranslate
    };
    (renderers[item.type] || renderChoice)(session, item);
  }

  // record + advance
  function record(session, correct, word) {
    session.answered++;
    if (correct) session.correct++;
    if (word) Storage.scheduleSrs(word, correct);
    session.idx++;
  }

  // ---- exercise renderers --------------------------------------------------

  function shell(session, body) {
    clear(app);
    app.appendChild(el("div", { class: "player" }, [progressHeader(session), body]));
  }

  function feedbackBar(ok, correctText, onNext, note) {
    return el("div", { class: "feedback " + (ok ? "ok" : "no") }, [
      el("div", { class: "feedback-text" }, [
        ok ? "✓ Correct!" : "✗ " + correctText,
        note ? el("div", { class: "feedback-note" }, note) : null
      ]),
      el("button", { class: "btn primary", onclick: onNext }, "Continue →")
    ]);
  }

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

  const accentNote = (answer) => "Mind the Polish letters: " + answer;

  function renderFlashcard(session, item) {
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, "New word"),
      el("div", { class: "card flash" }, [
        el("div", { class: "flash-it" }, item.it),
        el("button", { class: "audio-btn", onclick: () => A.speak(item.it), "aria-label": "Listen" }, "🔊"),
        el("div", { class: "flash-en muted" }, item.en)
      ]),
      el("button", { class: "btn primary big", onclick: () => { record(session, true); nextItem(session); } }, "Got it →")
    ]);
    shell(session, body);
    if (A.supported) setTimeout(() => A.speak(item.it), 250);
  }

  function renderChoice(session, item) {
    const isItEn = item.mode === "it-en";
    const promptNode = el("div", { class: "prompt" }, [
      el("span", {}, item.prompt),
      isItEn ? el("button", { class: "audio-btn small", onclick: () => A.speak(item.prompt) }, "🔊") : null
    ]);
    const opts = el("div", { class: "options" });
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, isItEn ? "What does this mean?" : "How do you say this?"),
      promptNode, opts
    ]);
    item.options.forEach((opt) => {
      const b = el("button", { class: "option", onclick: () => {
        const ok = opt === item.answer;
        if (window.Sound) (ok ? Sound.correct() : Sound.wrong());
        [...opts.children].forEach((c) => (c.disabled = true));
        b.classList.add(ok ? "correct" : "wrong");
        if (!ok) {
          [...opts.children].find((c) => c.textContent === item.answer)?.classList.add("correct");
          session.mistakes.push(`${item.prompt} = ${item.answer}`);
        }
        record(session, ok, isItEn ? item.prompt : item.answer);
        body.appendChild(feedbackBar(ok, `${item.prompt} = ${item.answer}`, () => nextItem(session)));
      }}, opt);
      opts.appendChild(b);
    });
    shell(session, body);
  }

  function renderListening(session, item) {
    const opts = el("div", { class: "options" });
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, "Listen and choose the meaning"),
      el("button", { class: "card listen-big", onclick: () => A.speak(item.it) }, "🔊 Tap to listen"),
      opts
    ]);
    item.options.forEach((opt) => {
      const b = el("button", { class: "option", onclick: () => {
        const ok = opt === item.answer;
        if (window.Sound) (ok ? Sound.correct() : Sound.wrong());
        [...opts.children].forEach((c) => (c.disabled = true));
        b.classList.add(ok ? "correct" : "wrong");
        if (!ok) {
          [...opts.children].find((c) => c.textContent === item.answer)?.classList.add("correct");
          session.mistakes.push(`${item.it} = ${item.answer}`);
        }
        record(session, ok, item.it);
        body.appendChild(feedbackBar(ok, `${item.it} = ${item.answer}`, () => nextItem(session)));
      }}, opt);
      opts.appendChild(b);
    });
    shell(session, body);
    if (A.supported) setTimeout(() => A.speak(item.it), 300);
    if (!A.supported) {
      body.insertBefore(el("div", { class: "muted small" }, "(Audio not supported here — the word is: " + item.it + ")"), opts);
    }
  }

  function renderMatch(session, item) {
    const left = Exercises.shuffle(item.pairs);
    const right = Exercises.shuffle(item.pairs);
    let selected = null, matched = 0;
    const colL = el("div", { class: "match-col" });
    const colR = el("div", { class: "match-col" });
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, "Match the pairs"),
      el("div", { class: "match" }, [colL, colR])
    ]);

    function clearSel() {
      if (selected) selected.el.classList.remove("sel");
      selected = null;
    }
    left.forEach((p) => {
      const b = el("button", { class: "option match-it", onclick: () => {
        if (b.disabled) return;
        clearSel(); selected = { p, el: b }; b.classList.add("sel");
        A.speak(p.it);
      }}, p.it);
      colL.appendChild(b);
    });
    right.forEach((p) => {
      const b = el("button", { class: "option", onclick: () => {
        if (b.disabled || !selected) return;
        if (selected.p.en === p.en) {
          if (window.Sound) Sound.correct();
          b.classList.add("correct"); selected.el.classList.add("correct");
          b.disabled = true; selected.el.disabled = true;
          clearSel(); matched++;
          if (matched === item.pairs.length) {
            if (window.Sound) Sound.complete();
            record(session, true);
            body.appendChild(feedbackBar(true, "", () => nextItem(session)));
          }
        } else {
          if (window.Sound) Sound.wrong();
          b.classList.add("wrong"); selected.el.classList.add("wrong");
          const sEl = selected.el;
          setTimeout(() => { b.classList.remove("wrong"); sEl.classList.remove("wrong"); }, 600);
          clearSel();
        }
      }}, p.en);
      colR.appendChild(b);
    });
    shell(session, body);
  }

  function renderFill(session, item) {
    const input = el("input", { class: "text-input", type: "text", autocomplete: "off",
      autocapitalize: "off", spellcheck: "false", placeholder: "Type the missing word" });
    const sentenceCard = el("div", { class: "card sentence" }, [
      el("span", {}, item.sentence),
      A.supported ? el("button", { class: "audio-btn small", title: "Listen in Polish",
        onclick: () => A.speak(item.full) }, "🔊") : null
    ]);
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, "Fill in the blank"),
      sentenceCard,
      el("div", { class: "muted translation" }, item.translation),
      input,
      plKeyboard(input)
    ]);
    let done = false;
    const submit = () => {
      if (done) return;
      done = true;
      const detail = Exercises.checkTypedDetail(input.value, item.answer);
      const ok = !!detail;
      if (window.Sound) (ok ? Sound.correct() : Sound.wrong());
      input.disabled = true;
      input.classList.add(ok ? "correct" : "wrong");
      if (!ok) session.mistakes.push(item.full);
      record(session, ok, item.answer);
      const fb = feedbackBar(ok, `${item.full}`, () => nextItem(session), detail === "accents" ? accentNote(item.answer) : null);
      if (A.supported) fb.insertBefore(el("button", { class: "audio-btn small",
        onclick: () => A.speak(item.full) }, "🔊"), fb.firstChild);
      // Hear the full, correct sentence read aloud in Polish.
      A.speak(item.full);
      body.appendChild(fb);
    };
    body.appendChild(el("button", { class: "btn primary", onclick: submit }, "Check"));
    shell(session, body);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    setTimeout(() => input.focus(), 50);
  }

  function renderTranslate(session, item) {
    const input = el("input", { class: "text-input", type: "text", autocomplete: "off",
      autocapitalize: "off", spellcheck: "false", placeholder: "Type in Polish" });
    const body = el("div", { class: "exercise" }, [
      el("div", { class: "ex-kicker muted" }, "Translate into Polish"),
      el("div", { class: "card sentence" }, item.en),
      input,
      plKeyboard(input)
    ]);
    let done = false;
    const submit = () => {
      if (done) return;
      done = true;
      const detail = Exercises.checkTypedDetail(input.value, item.it);
      const ok = !!detail;
      if (window.Sound) (ok ? Sound.correct() : Sound.wrong());
      input.disabled = true;
      input.classList.add(ok ? "correct" : "wrong");
      if (!ok) session.mistakes.push(`${item.en} = ${item.it}`);
      record(session, ok, item.it);
      const fb = feedbackBar(ok, `${item.en} → ${item.it}`, () => nextItem(session), detail === "accents" ? accentNote(item.it) : null);
      fb.insertBefore(el("button", { class: "audio-btn small", onclick: () => A.speak(item.it) }, "🔊"), fb.firstChild);
      A.speak(item.it);
      body.appendChild(fb);
    };
    body.appendChild(el("button", { class: "btn primary", onclick: submit }, "Check"));
    shell(session, body);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    setTimeout(() => input.focus(), 50);
  }

  // ========================================================================
  // RESULTS
  // ========================================================================
  function finish(session) {
    const score = session.answered ? session.correct / session.answered : 0;
    const pctRaw = Math.round(score * 100);
    const res = Storage.completeStep(session.levelId, session.stepN, score, { preview: session.preview });

    clear(app);
    const levelIdx = COURSE.levels.findIndex((l) => l.id === session.levelId);
    const passedExam = res.isExam && res.passed;        // validated & saved (incl. test-out)
    const failedExam = res.isExam && !res.passed;        // not saved
    const previewLesson = !res.isExam && !res.saved;     // overview only, not saved
    // savedLesson = !res.isExam && res.saved

    if (window.Sound) {
      if (passedExam) Sound.levelup();
      else if (failedExam) Sound.wrong();
      else if (score >= 0.5) Sound.complete();
      else Sound.wrong();
    }

    const emoji = passedExam ? "🏆" : failedExam ? "💪" : previewLesson ? "👁"
      : score >= 0.9 ? "🌟" : score >= 0.7 ? "🎉" : "👍";
    const title = passedExam ? "Level validated!"
      : failedExam ? (session.preview ? "Preview complete" : "Almost there!")
      : previewLesson ? "Overview complete" : "Step complete!";

    const actions = el("div", { class: "result-actions" });
    if (passedExam) {
      const nextLevel = COURSE.levels[levelIdx + 1];
      if (nextLevel) actions.appendChild(el("button", { class: "btn primary big", onclick: () => routeLevel(nextLevel.id) }, `Start ${nextLevel.id} →`));
      actions.appendChild(el("button", { class: "btn ghost", onclick: routeHome }, "Home"));
    } else if (failedExam) {
      actions.appendChild(el("button", { class: "btn primary big", onclick: () => routeLesson(session.levelId, session.stepN) }, "Retry exam"));
      if (session.preview) actions.appendChild(el("button", { class: "btn", onclick: () => routeLevel(session.levelId) }, "Study this level first"));
      actions.appendChild(el("button", { class: "btn ghost", onclick: () => routeLevel(session.levelId) }, "Back to path"));
    } else {
      const nextStep = session.stepN + 1;
      if (nextStep <= STEPS_PER_LEVEL) actions.appendChild(el("button", { class: "btn primary big", onclick: () => routeLesson(session.levelId, nextStep) }, "Next step →"));
      actions.appendChild(el("button", { class: "btn ghost", onclick: () => routeLevel(session.levelId) }, "Back to path"));
    }

    const statsLine = res.saved
      ? `${session.correct} / ${session.answered} correct · +${10 + Math.round(score * 10)} XP`
      : `${session.correct} / ${session.answered} correct · 👁 Preview — not saved`;

    const card = el("div", { class: "card result", style: `--accent:${session.level.color}` }, [
      el("div", { class: "result-emoji" }, emoji),
      el("h2", {}, title),
      el("div", { class: "score-ring", style: `--p:${pctRaw}` }, [
        el("span", { class: "score-num" }, pctRaw + "%")
      ]),
      el("div", { class: "result-stats muted" }, statsLine),
      passedExam && levelIdx > 0 ? el("p", { class: "muted" }, "All earlier levels are now unlocked (rating 0) — replay any lesson anytime to earn a real score.") : null,
      failedExam ? el("p", { class: "muted" }, `You need ${Math.round(PASS_THRESHOLD * 100)}% to pass.` + (session.preview ? " This attempt wasn't saved." : " Review and try again — you've got this!")) : null,
      previewLesson ? el("p", { class: "muted" }, "This lesson is locked, so your score wasn't saved. Pass the level's exam (step 31) to unlock it for real.") : null
    ]);

    if (session.mistakes.length) {
      const m = el("details", { class: "mistakes" }, [el("summary", {}, `Review ${session.mistakes.length} item${session.mistakes.length > 1 ? "s" : ""} to revisit`)]);
      session.mistakes.slice(0, 12).forEach((mk) => m.appendChild(el("div", { class: "mistake-item" }, mk)));
      card.appendChild(m);
    }
    card.appendChild(actions);
    app.appendChild(el("div", { class: "player center" }, [card]));
  }

  // ========================================================================
  // LIFE IN POLAND — practical survival guide (always unlocked)
  // ========================================================================
  function routeGuide() {
    clear(app);
    app.appendChild(topBar(routeHome));
    app.appendChild(el("section", { class: "level-head", style: "--accent:#c8102e" }, [
      el("h2", {}, "🧭 Life in Poland"),
      el("p", { class: "muted" }, "Practical tips for settling in and managing daily life as an international student. Tap 🔊 to hear any phrase. Rules change — always confirm with the office concerned.")
    ]));

    GUIDE.forEach((sec, i) => {
      const d = el("details", { class: "guide-sec" }, [
        el("summary", {}, [el("span", { class: "guide-sec-ico" }, sec.icon), el("span", {}, sec.title)])
      ]);
      if (i === 0) d.setAttribute("open", "");
      d.appendChild(el("ul", { class: "guide-tips" }, sec.tips.map((t) => el("li", { html: t }))));
      d.appendChild(el("div", { class: "kicker" }, "Key phrases"));
      const list = el("div", { class: "phrase-list" });
      sec.phrases.forEach(([pl, en]) => {
        list.appendChild(el("div", { class: "phrase" }, [
          A.supported ? el("button", { class: "audio-btn small", "aria-label": "Listen", onclick: () => A.speak(pl) }, "🔊") : null,
          el("div", { class: "phrase-txt" }, [el("div", { class: "phrase-pl" }, pl), el("div", { class: "muted small" }, en)])
        ]));
      });
      d.appendChild(list);
      app.appendChild(d);
    });
    app.appendChild(footer());
  }

  // ========================================================================
  // SETTINGS — name, backup (export/import), reset
  // ========================================================================
  function routeSettings() {
    const s = Storage.get();
    clear(app);
    app.appendChild(topBar(routeHome));

    const nameInput = el("input", { class: "text-input", type: "text", value: s.name || "", placeholder: "Your name (optional)" });
    nameInput.addEventListener("change", () => { Storage.setName(nameInput.value.trim()); toast("Saved ✓", "ok"); });

    const importArea = el("textarea", { class: "text-area", placeholder: "Paste exported progress JSON here…" });

    const body = el("section", { class: "settings" }, [
      el("h2", {}, "Settings & Backup"),

      el("div", { class: "setting" }, [
        el("label", {}, "Name"),
        nameInput
      ]),

      el("div", { class: "setting" }, [
        el("label", {}, "Appearance"),
        (() => {
          const wrap = el("div", { class: "theme-toggle" });
          Theme.ORDER.forEach((t) => {
            const m = Theme.META[t];
            const btn = el("button", { class: "seg" + (Theme.get() === t ? " active" : "") }, [
              el("span", { class: "seg-ico" }, m.icon),
              el("span", {}, m.label)
            ]);
            btn.addEventListener("click", () => {
              Theme.set(t);
              [...wrap.children].forEach((c) => c.classList.remove("active"));
              btn.classList.add("active");
              toast(m.label + " theme " + m.icon);
            });
            wrap.appendChild(btn);
          });
          return wrap;
        })()
      ]),

      el("div", { class: "setting" }, [
        el("label", {}, "Sound & Voice"),
        (() => {
          const mkSlider = (icon, label, get, onInput, onRelease) => {
            const pct = Math.round(get() * 100);
            const valEl = el("span", { class: "slider-val" }, pct + "%");
            const input = el("input", { class: "slider", type: "range", min: "0", max: "100",
              step: "5", value: String(pct), "aria-label": label });
            input.addEventListener("input", () => {
              const v = parseInt(input.value, 10) / 100;
              valEl.textContent = input.value + "%";
              onInput(v);
            });
            input.addEventListener("change", () => onRelease(parseInt(input.value, 10) / 100));
            return el("div", { class: "slider-row" }, [
              el("div", { class: "slider-head" }, [el("span", {}, `${icon} ${label}`), valEl]),
              input
            ]);
          };

          const voice = mkSlider("🗣️", "Reading voice volume",
            () => A.getVolume(),
            (v) => A.setVolume(v),
            (v) => { if (v > 0) A.speak("Cześć! Uczymy się polskiego."); });

          const fx = mkSlider("🔔", "Feedback sounds volume",
            () => Sound.getVolume(),
            (v) => Sound.setVolume(v),
            (v) => { if (v > 0) Sound.correct(); });

          const note = el("p", { class: "muted small" },
            A.supported ? "" : "Reading voice isn't supported in this browser.");
          return el("div", {}, [voice, fx, note]);
        })()
      ]),

      el("div", { class: "setting" }, [
        el("label", {}, "Your progress lives in this browser"),
        el("p", { class: "muted small" }, "It persists when you close the tab. To move to another device or browser, export it and import it there."),
        el("div", { class: "row" }, [
          el("button", { class: "btn", onclick: () => {
            const blob = new Blob([Storage.exportJSON()], { type: "application/json" });
            const a = el("a", { href: URL.createObjectURL(blob), download: "popolsku-progress.json" });
            document.body.appendChild(a); a.click(); a.remove();
            toast("Exported ✓", "ok");
          }}, "⬇ Export progress"),
          el("button", { class: "btn", onclick: () => {
            navigator.clipboard?.writeText(Storage.exportJSON());
            toast("Copied to clipboard ✓", "ok");
          }}, "📋 Copy")
        ])
      ]),

      el("div", { class: "setting" }, [
        el("label", {}, "Import progress"),
        importArea,
        el("button", { class: "btn", onclick: () => {
          try { Storage.importJSON(importArea.value); toast("Imported ✓", "ok"); routeHome(); }
          catch (e) { toast("Invalid file ✗", "no"); }
        }}, "Import")
      ]),

      el("div", { class: "setting danger" }, [
        el("label", {}, "Danger zone"),
        el("button", { class: "btn danger", onclick: () => {
          if (confirm("Erase ALL progress? This cannot be undone.")) { Storage.reset(); toast("Progress reset"); routeHome(); }
        }}, "🗑 Reset all progress")
      ]),

      el("p", { class: "muted small" }, A.supported ? "🔊 Audio (text-to-speech) is available in this browser." : "🔇 This browser doesn't support speech — listening exercises show the word as text.")
    ]);
    app.appendChild(body);
  }

  // ---- boot ----------------------------------------------------------------
  routeHome();
})();
