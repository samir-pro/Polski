# Po Polsku! 🇵🇱 — Learn Polish from A0 → C2 (through English)

A self-contained web app for learning Polish **from absolute zero**. It's built
around the words and phrases people actually use every day in Poland, with a
strong focus on **settling in and managing daily life as an international
student**: residence card, PESEL, opening a bank account, public transport, the
doctor, renting a room, university admin, student jobs, and Polish etiquette.

Each level has **31 steps**: 30 themed lessons plus a **validation exam (step 31)**.
Passing the exam unlocks the next level.

No backend, no login, no build step. Everything runs in the browser, and your
progress is saved locally so you can close the tab and carry on later. It also works
**offline** and can be installed to your home screen.

## Use it online

The app is published with **GitHub Pages** by `.github/workflows/pages.yml` on every push:

**https://samir-pro.github.io/Polski/**

One-time setup in the repository: *Settings → Pages → Build and deployment → Source: **GitHub Actions***.
(GitHub Pages for a private repository needs a paid GitHub plan; on a free plan, make the repository public.)

## Run it locally

It's plain HTML/CSS/JS. Serve the folder (so the offline service worker can register) and open it:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## What's inside

| Area | Detail |
|------|--------|
| **Levels** | A0 (absolute zero), A1, A2, B1, B2, C1, C2 |
| **Per level** | 30 themed lessons + 1 validation exam = 31 steps |
| **Total** | 217 steps, ~1,700 high-frequency words & phrases, 420 example sentences, a tip on every lesson |
| **9 exercise types** | flashcards · multiple choice (both directions) · listening · matching · fill-in-the-blank · type-to-translate · **sentence builder** (word-order tiles) · **dictation** · **speaking** (speech recognition) |
| **Forgiving checking** | Answers typed without `ą ć ę ł ń ó ś ź ż`, and small typos in long answers, are accepted with a note showing the exact spelling. Fill-in-the-blank stays strict, since one letter is often the case ending |
| **Polish keyboard** | On-screen `ą ć ę ł ń ó ś ź ż` keys |
| **Audio** | Polish text-to-speech (`pl-PL`) via the Web Speech API: best-quality voice picked automatically, voice chooser, **🐢 slow replay**, adjustable speed (0.5×–1.5×) |
| **Spaced repetition** | Every word you practise goes into Leitner boxes (1 → 30 days). **Daily review**, **tricky words** and **quick practice** sessions |
| **Daily goal** | XP goal (10/20/30/50), progress ring, 7-day activity chart, day streak, ★ ratings per step, **Continue** button |
| **Grammar reference** | 17 cheat sheets: sounds, noun gender, present tense, the seven cases, accusative, pronouns, numbers & złoty, past tense, aspect & future, genitive, instrumental, locative, verbs of motion, prepositions, conditional, imperative, impersonal forms & participles |
| **Dictionary** | Every word in the course, searchable in Polish or English (with or without Polish letters), filter by level, with audio and learning status |
| **Life in Poland guide** | Always-open survival guide: emergencies, visa/residence & PESEL, university, housing, banking & BLIK, transport, shopping, health & insurance, phone/SIM, student work, etiquette. Tips + key phrases with audio |
| **Review past answers** | **← Previous / Next →** in every lesson and exam to look back at answered questions (read-only) |
| **Keyboard** | `1`–`4` choose, `Enter` checks/continues, `←` `→` step through answered questions |
| **Themes & offline** | Light / medium / dark themes, installable PWA with offline cache |

### Level overview

- **A0 · Absolute Zero**: Polish sounds and letters, greetings, polite *pan/pani*,
  numbers, café & corner-shop survival, transport basics, emergencies (112), signs.
- **A1 · Beginner**: present tense, accusative, supermarket, Polish dishes,
  tickets & validating, renting a room, university basics, SIM cards, parcel lockers.
- **A2 · Elementary**: past & future, aspect, bank & BLIK, residence card & PESEL,
  office queues, the doctor & NFZ, trains, recycling, holidays, student jobs.
- **B1 · Intermediate**: conditional, opinions, student admin, formal emails to
  lecturers, neighbours, rental contracts, healthcare in practice, etiquette, colloquial Polish.
- **B2 · Upper-Intermediate**: officialese, rights, taxes (PIT/ZUS), employment
  contracts, debate, idioms, proverbs, traditions, diminutives.
- **C1 · Advanced**: academic writing & thesis, business and legal Polish, register
  shifts, slang, particles, regional Polish, false friends, settling long-term.
- **C2 · Mastery**: literary & archaic Polish, allusions and historical sayings, legal
  precision, chasing slow bureaucracy (ponaglenie), fine shades of meaning, irony,
  participles & impersonal forms, poetry, cult films, PRL vocabulary, spelling & punctuation, rhetoric.

## How progress works

Progress is stored in the browser via **`localStorage`** under the key
`popolsku.progress.v1`:

- Close the browser and come back: your progress is still there, and **Continue** takes you to your next step.
- Progress saved by earlier versions of the app is picked up automatically.
- Future steps stay locked until you finish the previous one. Locked lessons can
  still be opened in **preview** mode, but those scores aren't saved.
- **Test out**: pass any level's exam, even while the level is locked, to validate
  it and every level before it.
- **Export / Import** under *Settings* (file or clipboard) lets you back up your progress or move it to
  another device.

## Project structure

```
index.html            App shell
manifest.webmanifest  Installable app (PWA) metadata
sw.js                 Service worker — offline cache
css/styles.css        Mobile-first UI, light / medium / dark themes
js/content.js         Course content (levels → lessons → vocab / examples)
js/guide.js           "Life in Poland" survival guide (tips + phrases)
js/grammar.js         Grammar cheat sheets
js/exercises.js       Builds exercise sequences; forgiving Polish answer checking
js/storage.js         localStorage progress, unlocking, streaks, daily goal, SRS, backup
js/audio.js           Polish text-to-speech + speech recognition
js/sounds.js          Synthesized feedback sounds
js/app.js             Hash routing, screens & lesson player
tools/validate.js     Content checks (also run in CI and before each deploy)
```

## Adding or editing content

The content is data-driven. To add words to a lesson, edit `js/content.js`:

```js
{
  title: "At the Corner Shop",
  tip: "<b>Żabka</b> is the green convenience store on almost every corner…",
  vocab: [ ["paragon", "receipt"], ["kartą", "by card"] ],
  examples: [ ["Płacę kartą.", "I'm paying by card.", "kartą"] ] // 3rd = word to blank
}
```

Use `/` in the Polish side to accept alternatives (e.g. `"dziś / dzisiaj"`), and
add notes in parentheses, which are ignored when checking typed answers. The word to
blank must appear in the sentence as a whole word. Example sentences also become
sentence-builder, dictation and speaking exercises.

Then run the validator:

```bash
node tools/validate.js
```

If you add a new script file, list it in `index.html` **and** in `sw.js` (the validator checks both).

> Practical rules (residence permits, insurance, discounts, work rights) change
> over time. The guide points you to the right office, but always confirm with
> your university's international office or the relevant authority.
