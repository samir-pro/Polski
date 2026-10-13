# Po Polsku! 🇵🇱 — Learn Polish from A0 → C2 (through English)

A self-contained web app for learning Polish **from absolute zero**. It's built
around the words and phrases people actually use every day in Poland, with a
strong focus on **settling in and managing daily life as an international
student**: residence card, PESEL, opening a bank account, public transport, the
doctor, renting a room, university admin, student jobs, and Polish etiquette.

Each level has **31 steps**: 30 themed lessons plus a **validation exam (step 31)**.
Passing the exam unlocks the next level.

No backend, no login, no build step. Everything runs in the browser, and your
progress is saved locally so you can close the tab and carry on later.

## Use it online

The app is published with **GitHub Pages** by `.github/workflows/pages.yml` on every push:

**https://samir-pro.github.io/Polski/**

One-time setup in the repository: *Settings → Pages → Build and deployment → Source: **GitHub Actions***.
(GitHub Pages for a private repository needs a paid GitHub plan; on a free plan, make the repository public.)

## Run it locally

It's plain HTML/CSS/JS. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## What's inside

| Area | Detail |
|------|--------|
| **Levels** | A0 (absolute zero), A1, A2, B1, B2, C1, C2 |
| **Per level** | 30 themed lessons + 1 validation exam = 31 steps |
| **Total** | 217 steps, ~1,700 high-frequency words & phrases, a tip on every lesson, example sentences |
| **Life in Poland guide** | Always-open survival guide: emergencies, visa/residence & PESEL, university, housing, banking & BLIK, transport, shopping, health & insurance, phone/SIM, student work, etiquette. Each section has tips + key phrases with audio |
| **Exercises** | flashcards, multiple choice (both directions), listening, matching, fill-in-the-blank, type-to-translate |
| **Polish keyboard** | On-screen `ą ć ę ł ń ó ś ź ż` keys. Answers typed without diacritics still count, and the app shows the correct spelling |
| **Audio** | Polish text-to-speech (`pl-PL`) through the browser's Web Speech API. No audio files |
| **Gamification** | XP, daily streak, per-step scores, a winding level path, sound effects |
| **Spaced repetition** | Words you miss come back later (Leitner boxes) |

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

- Close the browser and come back: your progress is still there.
- Future steps stay locked until you finish the previous one. Locked lessons can
  still be opened in **preview** mode, but those scores aren't saved.
- **Test out**: pass any level's exam, even while the level is locked, to validate
  it and every level before it.
- **Export / Import** under *Settings* lets you back up your progress or move it to
  another device.

## Project structure

```
index.html          App shell
css/styles.css      Mobile-first UI, light / medium / dark themes
js/content.js       Course content (levels → lessons → vocab / examples)
js/guide.js         "Life in Poland" survival guide (tips + phrases)
js/exercises.js     Builds exercise sequences; forgiving Polish answer checking
js/storage.js       localStorage progress, unlocking, streaks, SRS, export/import
js/audio.js         Polish text-to-speech helper
js/sounds.js        Synthesized feedback sounds
js/app.js           Screens & lesson player
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
add notes in parentheses, which are ignored when checking typed answers.

> Practical rules (residence permits, insurance, discounts, work rights) change
> over time. The guide points you to the right office, but always confirm with
> your university's international office or the relevant authority.
