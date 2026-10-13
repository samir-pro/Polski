#!/usr/bin/env node
/* ============================================================================
 * Content validator — run with `node tools/validate.js`.
 *
 * Loads the course, guide and grammar files exactly as the browser does and
 * checks the rules the exercise engine depends on. Exits non-zero on errors,
 * so it also runs in CI before every deploy.
 * ========================================================================== */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
const dataScripts = scripts.filter((s) => s.startsWith("js/content") || s === "js/guide.js" || s === "js/grammar.js");
dataScripts.forEach((s) => vm.runInContext(fs.readFileSync(path.join(root, s), "utf8"), ctx, { filename: s }));

// Every script in index.html must exist and be cached by the service worker.
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const errors = [];
const warnings = [];
scripts.forEach((s) => {
  if (!fs.existsSync(path.join(root, s))) errors.push(`index.html references missing file ${s}`);
  if (!sw.includes(`"${s}"`)) errors.push(`sw.js does not cache ${s}`);
});

const { COURSE, STEPS_PER_LEVEL, GUIDE, GRAMMAR } = ctx;
const EXPECTED_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const ids = COURSE.levels.map((l) => l.id);
if (ids.join() !== EXPECTED_LEVELS.join()) errors.push(`levels are ${ids.join()} — expected ${EXPECTED_LEVELS.join()}`);

// Whole-word test that understands Polish letters (\b doesn't).
const hasWord = (sentence, word) =>
  new RegExp(`(^|[^\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^\\p{L}\\p{N}])`, "u").test(sentence);

let lessons = 0, words = 0, sentences = 0;

COURSE.levels.forEach((level) => {
  const where = level.id;
  ["id", "name", "blurb", "color"].forEach((k) => { if (!level[k]) errors.push(`${where}: missing ${k}`); });
  if (level.lessons.length !== STEPS_PER_LEVEL - 1) errors.push(`${where}: ${level.lessons.length} lessons — expected ${STEPS_PER_LEVEL - 1}`);

  const seenTitles = new Set();
  level.lessons.forEach((lesson, i) => {
    const at = `${where} step ${i + 1} "${lesson.title}"`;
    lessons++;
    if (!lesson.title || !lesson.tip) errors.push(`${at}: needs a title and a tip`);
    if (seenTitles.has(lesson.title)) errors.push(`${at}: duplicate title in level`);
    seenTitles.add(lesson.title);
    if (!Array.isArray(lesson.vocab) || lesson.vocab.length < 6) errors.push(`${at}: needs at least 6 vocab items`);
    if (!Array.isArray(lesson.examples) || lesson.examples.length < 2) errors.push(`${at}: needs at least 2 examples`);
    if ((lesson.tip.match(/<b>/g) || []).length !== (lesson.tip.match(/<\/b>/g) || []).length) errors.push(`${at}: unbalanced <b> in tip`);

    const seenPl = new Set(), seenEn = new Map();
    (lesson.vocab || []).forEach((v) => {
      words++;
      if (v.length !== 2 || !v[0] || !v[1]) return errors.push(`${at}: bad vocab entry ${JSON.stringify(v)}`);
      if (v[0] !== v[0].trim() || v[1] !== v[1].trim()) errors.push(`${at}: stray whitespace in ${JSON.stringify(v)}`);
      if (seenPl.has(v[0])) errors.push(`${at}: duplicate Polish "${v[0]}"`);
      seenPl.add(v[0]);
      if (seenEn.has(v[1])) warnings.push(`${at}: "${v[0]}" and "${seenEn.get(v[1])}" share the meaning "${v[1]}"`);
      seenEn.set(v[1], v[0]);
    });
    (lesson.examples || []).forEach((ex) => {
      sentences++;
      if (ex.length !== 3) return errors.push(`${at}: example needs [polish, english, blank]: ${JSON.stringify(ex)}`);
      if (!hasWord(ex[0], ex[2])) errors.push(`${at}: blank "${ex[2]}" is not a whole word in "${ex[0]}"`);
    });
  });
});

if (!Array.isArray(GUIDE) || GUIDE.length < 8) errors.push("guide.js: expected at least 8 sections");
(GUIDE || []).forEach((s) => {
  if (!s.icon || !s.title || !s.tips?.length || !s.phrases?.length) errors.push(`guide "${s.title}": needs icon, title, tips and phrases`);
});
if (!Array.isArray(GRAMMAR) || GRAMMAR.length < 8) errors.push("grammar.js: expected at least 8 topics");
(GRAMMAR || []).forEach((g) => {
  if (!g.title || !g.level || !g.html) errors.push(`grammar "${g.title}": needs title, level and html`);
});

warnings.forEach((w) => console.warn("warn  " + w));
errors.forEach((e) => console.error("ERROR " + e));
console.log(`\n${COURSE.levels.length} levels · ${lessons} lessons · ${words} vocab items · ${sentences} example sentences · ${GUIDE.length} guide sections · ${GRAMMAR.length} grammar topics`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} error(s)`);
  process.exit(1);
}
console.log("✓ content OK");
