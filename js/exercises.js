/* ============================================================================
 * Exercises — generates a varied exercise sequence from lesson data.
 *
 * Exercise types produced:
 *   - flashcard        : introduce a word (pl ↔ en) with audio
 *   - choice           : multiple choice (it→en or en→it)
 *   - listening        : hear Polish, choose the meaning
 *   - match            : match Polish words to English (pairs)
 *   - fill             : fill the blank in an example sentence
 *   - translate        : type the Polish translation
 *
 * The mixture shifts by level: lower levels lean on recognition, upper levels
 * lean on production (typing/translation).
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

  // Pool of all vocab across a level (for plausible wrong answers).
  function levelVocabPool(level) {
    const pool = [];
    level.lessons.forEach((l) => l.vocab.forEach((v) => pool.push(v)));
    return pool;
  }

  function distractors(pool, correctEn, n = 3) {
    const opts = shuffle(pool.filter((v) => v[1] !== correctEn)).slice(0, n).map((v) => v[1]);
    return opts;
  }
  function distractorsIt(pool, correctIt, n = 3) {
    return shuffle(pool.filter((v) => v[0] !== correctIt)).slice(0, n).map((v) => v[0]);
  }

  // How heavily to favor production exercises (0..1) per level.
  const PRODUCTION_WEIGHT = { A0: 0.05, A1: 0.15, A2: 0.3, B1: 0.45, B2: 0.6, C1: 0.7, C2: 0.8 };

  /* Build the exercise list for a normal lesson step. */
  function buildLesson(level, lesson) {
    const pool = levelVocabPool(level);
    const items = [];
    const prod = PRODUCTION_WEIGHT[level.id] ?? 0.3;

    // 1) Flashcards introduce every word first.
    lesson.vocab.forEach((v) => {
      items.push({ type: "flashcard", it: v[0], en: v[1] });
    });

    // 2) A matching exercise to reinforce the set (chunks of up to 5 pairs).
    const pairs = shuffle(lesson.vocab).slice(0, Math.min(5, lesson.vocab.length));
    if (pairs.length >= 3) {
      items.push({ type: "match", pairs: pairs.map((v) => ({ it: v[0], en: v[1] })) });
    }

    // 3) Per-word practice — pick type based on production weight.
    shuffle(lesson.vocab).forEach((v, i) => {
      const useProduction = Math.random() < prod;
      if (useProduction) {
        items.push({ type: "translate", it: v[0], en: v[1] });
      } else {
        // alternate it→en and listening
        if (i % 2 === 0) {
          items.push({
            type: "choice", prompt: v[0], answer: v[1], mode: "it-en",
            options: shuffle([v[1], ...distractors(pool, v[1])])
          });
        } else {
          items.push({
            type: "listening", it: v[0], answer: v[1],
            options: shuffle([v[1], ...distractors(pool, v[1])])
          });
        }
      }
    });

    // 4) en→it recognition for a couple of words.
    shuffle(lesson.vocab).slice(0, 2).forEach((v) => {
      items.push({
        type: "choice", prompt: v[1], answer: v[0], mode: "en-it",
        options: shuffle([v[0], ...distractorsIt(pool, v[0])])
      });
    });

    // 5) Fill-in-the-blank from example sentences.
    (lesson.examples || []).forEach((ex) => {
      const [it, en, blank] = ex;
      if (!blank || !it.includes(blank)) return;
      items.push({
        type: "fill",
        sentence: it.replace(blank, "____"),
        translation: en,
        answer: blank,
        full: it
      });
    });

    return items;
  }

  /* Build the validation exam (step 31): mixed questions across the whole level. */
  function buildExam(level, count = 20) {
    const pool = levelVocabPool(level);
    const picks = shuffle(pool).slice(0, Math.min(count, pool.length));
    const prod = (PRODUCTION_WEIGHT[level.id] ?? 0.3) + 0.1;

    const exam = picks.map((v, i) => {
      const r = Math.random();
      if (r < prod) {
        return { type: "translate", it: v[0], en: v[1] };
      } else if (i % 3 === 0) {
        return { type: "listening", it: v[0], answer: v[1], options: shuffle([v[1], ...distractors(pool, v[1])]) };
      } else if (i % 3 === 1) {
        return { type: "choice", prompt: v[0], answer: v[1], mode: "it-en", options: shuffle([v[1], ...distractors(pool, v[1])]) };
      } else {
        return { type: "choice", prompt: v[1], answer: v[0], mode: "en-it", options: shuffle([v[0], ...distractorsIt(pool, v[0])]) };
      }
    });

    // Add a few fill-in-the-blank from across the level's examples.
    const allExamples = [];
    level.lessons.forEach((l) => (l.examples || []).forEach((e) => allExamples.push(e)));
    shuffle(allExamples).slice(0, 4).forEach((ex) => {
      const [it, en, blank] = ex;
      if (blank && it.includes(blank)) {
        exam.push({ type: "fill", sentence: it.replace(blank, "____"), translation: en, answer: blank, full: it });
      }
    });

    return shuffle(exam);
  }

  // Normalize a typed answer for forgiving comparison.
  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .replace(/\([^)]*\)/g, "")          // drop notes like "(formal)"
      .replace(/[.,!?;:'"“”„…–—-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Polish letters → plain Latin, so a learner without a Polish keyboard can
  // still get credit (with a gentle reminder about the diacritics).
  const PL_MAP = { "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n", "ó": "o", "ś": "s", "ź": "z", "ż": "z" };
  const plain = (x) => x.replace(/[ąćęłńóśźż]/g, (c) => PL_MAP[c]);

  // Accepted answers: the full string plus each "/"-separated alternative.
  function variants(answer) {
    const full = normalize(answer);
    const parts = answer.split("/").map(normalize).filter(Boolean);
    return [full, ...parts];
  }

  /* Returns "exact", "accents" (right except Polish diacritics) or false. */
  function checkTypedDetail(input, answer) {
    const a = normalize(input);
    if (!a) return false;
    const vs = variants(answer);
    if (vs.includes(a)) return "exact";
    if (vs.map(plain).includes(plain(a))) return "accents";
    return false;
  }

  function checkTyped(input, answer) {
    return !!checkTypedDetail(input, answer);
  }

  return { buildLesson, buildExam, checkTyped, checkTypedDetail, normalize, shuffle };
})();

window.Exercises = Exercises;
