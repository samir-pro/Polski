/* ============================================================================
 * Exercises — generates varied exercise sequences from lesson data, and checks
 * typed / spoken Polish forgivingly.
 *
 * Exercise types:
 *   flashcard  introduce a word (with audio + slow replay)
 *   choice     multiple choice, Polish → English or English → Polish
 *   listening  hear Polish, choose the meaning
 *   match      match Polish words to English (pairs)
 *   fill       fill the blank in an example sentence
 *   translate  type the Polish for an English prompt
 *   build      put word tiles in the right order
 *   dictation  hear a sentence and type it            (needs text-to-speech)
 *   speak      read a sentence aloud, checked by ASR  (needs speech recognition)
 *
 * The mixture shifts by level: lower levels lean on recognition, upper levels
 * on production (typing, building, dictation).
 * ========================================================================== */

const Exercises = (() => {
  const rand = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // ---- vocabulary helpers ----------------------------------------------------
  const wordCount = (s) => s.trim().split(/\s+/).length;
  const kindOf = (v) => (wordCount(v[0]) >= 3 ? "phrase" : "word");

  let INDEX = null;
  // Polish text → { pl, en, levelId, step } for every vocab item in the course.
  function index() {
    if (INDEX) return INDEX;
    INDEX = new Map();
    COURSE.levels.forEach((lv) => lv.lessons.forEach((l, i) => l.vocab.forEach((v) => {
      if (!INDEX.has(v[0])) INDEX.set(v[0], { pl: v[0], en: v[1], levelId: lv.id, step: i + 1 });
    })));
    return INDEX;
  }

  function levelVocabPool(level) {
    const pool = [];
    level.lessons.forEach((l) => l.vocab.forEach((v) => pool.push(v)));
    return pool;
  }

  // Plausible wrong answers: same kind of item first (words with words,
  // phrases with phrases), never anything that shares the Polish or English.
  function distractors(pool, v, field, n = 3) {
    const bad = (x) => normalize(x[0]) === normalize(v[0]) || normalize(x[1]) === normalize(v[1]);
    const k = kindOf(v);
    const same = shuffle(pool.filter((x) => !bad(x) && kindOf(x) === k));
    const other = shuffle(pool.filter((x) => !bad(x) && kindOf(x) !== k));
    const out = [];
    for (const x of [...same, ...other]) {
      const val = x[field];
      if (!out.includes(val)) out.push(val);
      if (out.length === n) break;
    }
    return out;
  }

  const choicePlEn = (pool, v) => ({ type: "choice", mode: "pl-en", prompt: v[0], answer: v[1], word: v[0],
    options: shuffle([v[1], ...distractors(pool, v, 1)]) });
  const choiceEnPl = (pool, v) => ({ type: "choice", mode: "en-pl", prompt: v[1], answer: v[0], word: v[0],
    options: shuffle([v[0], ...distractors(pool, v, 0)]) });
  const listening = (pool, v) => ({ type: "listening", pl: v[0], answer: v[1], word: v[0],
    options: shuffle([v[1], ...distractors(pool, v, 1)]) });
  const translate = (v) => ({ type: "translate", pl: v[0], en: v[1], word: v[0] });

  // ---- sentence helpers ------------------------------------------------------
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function blankOut(sentence, word) {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(word)}(?=$|[^\\p{L}\\p{N}])`, "u");
    return sentence.replace(re, (m, pre) => pre + "____");
  }
  const tokens = (s) => s.replace(/[.,!?;:„“"”…–—]/g, " ").split(/\s+/).filter(Boolean);

  function fill(ex) {
    const [pl, en, blank] = ex;
    if (!blank) return null;
    const sentence = blankOut(pl, blank);
    if (sentence === pl) return null;
    return { type: "fill", sentence, translation: en, answer: blank, full: pl };
  }

  function build(ex, extraPool, level) {
    const words = tokens(ex[0]);
    if (words.length < 3 || words.length > 14) return null;
    const tiles = words.slice();
    // From B1 on, add one decoy tile so it can't be solved by elimination.
    if (["B1", "B2", "C1", "C2"].includes(level.id)) {
      const decoys = shuffle(extraPool.flatMap((e) => tokens(e[0])).filter((w) => !words.some((x) => x.toLowerCase() === w.toLowerCase())));
      if (decoys[0]) tiles.push(decoys[0]);
    }
    let order = shuffle(tiles);
    // Don't hand out the answer already in order.
    if (order.slice(0, words.length).join(" ") === words.join(" ")) order = order.slice().reverse();
    return { type: "build", pl: ex[0], en: ex[1], answer: words, tiles: order };
  }

  // How heavily to favour production exercises (0..1) per level.
  const PRODUCTION_WEIGHT = { A0: 0.05, A1: 0.15, A2: 0.3, B1: 0.45, B2: 0.55, C1: 0.65, C2: 0.75 };
  const usesDictation = (level) => !["A0", "A1"].includes(level.id);

  /* Build the exercise list for a normal lesson step.
   * opts: { audio: bool (TTS available), speaking: bool (ASR on) } */
  function buildLesson(level, lesson, opts = {}) {
    const pool = levelVocabPool(level);
    const prod = PRODUCTION_WEIGHT[level.id] ?? 0.3;
    const items = [];

    // 1) Flashcards introduce every word first.
    lesson.vocab.forEach((v) => items.push({ type: "flashcard", pl: v[0], en: v[1] }));

    // 2) Matching to reinforce the set.
    const pairs = shuffle(lesson.vocab).slice(0, Math.min(5, lesson.vocab.length));
    if (pairs.length >= 3) items.push({ type: "match", pairs: pairs.map((v) => ({ pl: v[0], en: v[1] })) });

    // 3) Word practice, mixed.
    const practice = [];
    shuffle(lesson.vocab).forEach((v, i) => {
      if (Math.random() < prod) practice.push(translate(v));
      else if (i % 2 === 0 || !opts.audio) practice.push(choicePlEn(pool, v));
      else practice.push(listening(pool, v));
    });
    shuffle(lesson.vocab).slice(0, 2).forEach((v) => practice.push(choiceEnPl(pool, v)));
    items.push(...shuffle(practice));

    // 4) Sentence work at the end, once the words are fresh.
    const ex = lesson.examples || [];
    const sentences = [];
    ex.map(fill).filter(Boolean).forEach((f) => sentences.push(f));
    const others = level.lessons.flatMap((l) => l.examples || []);
    shuffle(ex).map((e) => build(e, others, level)).filter(Boolean).slice(0, 2).forEach((b) => sentences.push(b));
    if (opts.audio && usesDictation(level) && ex.length) {
      const e = ex[rand(ex.length)];
      sentences.push({ type: "dictation", pl: e[0], en: e[1] });
    }
    if (opts.speaking && ex.length) {
      const e = ex[rand(ex.length)];
      sentences.push({ type: "speak", pl: e[0], en: e[1] });
    }
    items.push(...shuffle(sentences));
    return items;
  }

  /* Build the validation exam (step 31): mixed questions across the whole level. */
  function buildExam(level, opts = {}, count = 20) {
    const pool = levelVocabPool(level);
    const prod = (PRODUCTION_WEIGHT[level.id] ?? 0.3) + 0.1;
    const exam = shuffle(pool).slice(0, Math.min(count, pool.length)).map((v, i) => {
      if (Math.random() < prod) return translate(v);
      if (i % 3 === 0 && opts.audio) return listening(pool, v);
      if (i % 3 === 1) return choicePlEn(pool, v);
      return choiceEnPl(pool, v);
    });

    const allExamples = level.lessons.flatMap((l) => l.examples || []);
    shuffle(allExamples).map(fill).filter(Boolean).slice(0, 4).forEach((f) => exam.push(f));
    shuffle(allExamples).map((e) => build(e, allExamples, level)).filter(Boolean).slice(0, 2).forEach((b) => exam.push(b));
    if (opts.audio && usesDictation(level)) {
      const e = allExamples[rand(allExamples.length)];
      exam.push({ type: "dictation", pl: e[0], en: e[1] });
    }
    return shuffle(exam);
  }

  /* Build a review session from a list of Polish vocab items (SRS / weak words). */
  function buildReview(words, opts = {}, max = 15) {
    const idx = index();
    const entries = words.map((w) => idx.get(w)).filter(Boolean).slice(0, max);
    if (!entries.length) return [];
    // Distractors come from the levels the words belong to.
    const levels = new Set(entries.map((e) => e.levelId));
    const pool = COURSE.levels.filter((l) => levels.has(l.id)).flatMap(levelVocabPool);
    return shuffle(entries.map((e) => {
      const v = [e.pl, e.en];
      const options = [translate, (x) => choicePlEn(pool, x), (x) => choiceEnPl(pool, x)];
      if (opts.audio) options.push((x) => listening(pool, x));
      return options[rand(options.length)](v);
    }));
  }

  // ---- answer checking -------------------------------------------------------
  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")          // drop notes like "(formal)"
      .replace(/[.,!?;:'"„“”‚‘’…–—-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  // Polish letters → plain Latin, so a learner without a Polish keyboard can
  // still get credit (with a gentle reminder about the diacritics).
  const PL_MAP = { "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n", "ó": "o", "ś": "s", "ź": "z", "ż": "z" };
  const plain = (x) => x.replace(/[ąćęłńóśźż]/g, (c) => PL_MAP[c]);

  function variants(answer) {
    const parts = answer.split("/").map(normalize).filter(Boolean);
    return [normalize(answer), ...parts];
  }

  function levenshtein(a, b) {
    if (Math.abs(a.length - b.length) > 3) return 99;
    const row = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return row[b.length];
  }

  /* Compare typed Polish with the expected answer.
   * Returns "exact", "accents" (right except ą ć ę ł ń ó ś ź ż), "typo" (one
   * small slip in a longer answer) or false. */
  function checkTypedDetail(input, answer, opts = {}) {
    const a = normalize(input);
    if (!a) return false;
    const vs = variants(answer);
    if (vs.includes(a)) return "exact";
    if (vs.map(plain).includes(plain(a))) return "accents";
    // One slip per ~12 characters, and only for answers long enough that a
    // single wrong letter can't turn one real word into another. Off for
    // fill-in-the-blank, where one letter is usually the grammar point
    // (a case ending, a verb form).
    if (opts.typos !== false && vs.some((v) => v.length >= 8 && levenshtein(plain(v), plain(a)) <= Math.max(1, Math.floor(v.length / 12)))) return "typo";
    return false;
  }

  /* How close a spoken transcript is to the target sentence (0..1),
   * by the longest run of matching words in order. */
  function similarity(said, target) {
    const s = plain(normalize(said)).split(" ").filter(Boolean);
    const t = plain(normalize(target)).split(" ").filter(Boolean);
    if (!t.length) return 0;
    const dp = Array.from({ length: s.length + 1 }, () => new Array(t.length + 1).fill(0));
    for (let i = 1; i <= s.length; i++) {
      for (let j = 1; j <= t.length; j++) {
        dp[i][j] = s[i - 1] === t[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    return dp[s.length][t.length] / Math.max(t.length, s.length);
  }

  return {
    buildLesson, buildExam, buildReview, checkTypedDetail, similarity,
    normalize, shuffle, index, tokens, plain
  };
})();

window.Exercises = Exercises;
