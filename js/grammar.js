/* ============================================================================
 * Grammar reference — compact cheat sheets for Polish, always open.
 *
 * Data model per topic:  { level, title, html }
 * The html uses <table class="gtable"> for tables.
 * ========================================================================== */

const GRAMMAR = [
  {
    level: "A0", title: "Letters & sounds",
    html: `
<table class="gtable">
<tr><th>Spelling</th><th>Sounds like</th><th>Example</th></tr>
<tr><td>w</td><td>English v</td><td>woda (water)</td></tr>
<tr><td>ł</td><td>English w</td><td>łyżka (spoon)</td></tr>
<tr><td>c</td><td>ts</td><td>co (what)</td></tr>
<tr><td>ch / h</td><td>h in Scottish "loch"</td><td>chleb, herbata</td></tr>
<tr><td>sz · cz</td><td>sh · ch</td><td>szkoła, czas</td></tr>
<tr><td>rz · ż</td><td>s in "pleasure"</td><td>rzeka, żona</td></tr>
<tr><td>ś · ć · ź · ń<br><span class="muted small">si · ci · zi · ni</span></td><td>softer sh · ch · zh · ny</td><td>śniadanie, ciocia, źle, koń</td></tr>
<tr><td>dz · dż · dź</td><td>ds · j · soft j</td><td>dzwon, dżem, dźwięk</td></tr>
<tr><td>ą · ę</td><td>nasal "on" · "en" (final ę ≈ e)</td><td>mąż, ręka, proszę</td></tr>
<tr><td>ó = u</td><td>oo</td><td>góra, mówić</td></tr>
<tr><td>y</td><td>i in "bit"</td><td>ty, my</td></tr>
</table>
<p>Stress is almost always on the <b>second-to-last syllable</b>: <i>Wars<u>za</u>wa, uni<u>wer</u>sytet</i>. At the end of a word voiced consonants harden: <i>chleb</i> sounds like "chlep".</p>`
  },
  {
    level: "A0", title: "Noun gender",
    html: `
<p>Polish has no articles, but every noun is masculine, feminine or neuter — usually visible from the ending of the dictionary form.</p>
<table class="gtable">
<tr><th>Gender</th><th>Typical ending</th><th>Examples</th></tr>
<tr><td>Masculine</td><td>consonant</td><td>dom, stół, student, telefon</td></tr>
<tr><td>Feminine</td><td>-a (some -i, soft consonant)</td><td>kawa, szkoła, pani, noc, wiadomość</td></tr>
<tr><td>Neuter</td><td>-o, -e, -ę, -um</td><td>piwo, mieszkanie, imię, muzeum</td></tr>
</table>
<p class="muted small">Exceptions: male persons in -a are masculine (<i>mężczyzna, kierowca, kolega</i>). Nouns in <i>-ość</i> are feminine.</p>`
  },
  {
    level: "A1", title: "Present tense",
    html: `
<table class="gtable">
<tr><th></th><th>czytać<br><span class="muted small">-am, -asz</span></th><th>robić<br><span class="muted small">-ę, -isz</span></th><th>pisać<br><span class="muted small">-ę, -esz</span></th><th>być</th><th>mieć</th></tr>
<tr><td>ja</td><td>czytam</td><td>robię</td><td>piszę</td><td>jestem</td><td>mam</td></tr>
<tr><td>ty</td><td>czytasz</td><td>robisz</td><td>piszesz</td><td>jesteś</td><td>masz</td></tr>
<tr><td>on/ona/ono, pan/pani</td><td>czyta</td><td>robi</td><td>pisze</td><td>jest</td><td>ma</td></tr>
<tr><td>my</td><td>czytamy</td><td>robimy</td><td>piszemy</td><td>jesteśmy</td><td>mamy</td></tr>
<tr><td>wy</td><td>czytacie</td><td>robicie</td><td>piszecie</td><td>jesteście</td><td>macie</td></tr>
<tr><td>oni/one, państwo</td><td>czytają</td><td>robią</td><td>piszą</td><td>są</td><td>mają</td></tr>
</table>
<p>The ending already shows the person, so pronouns are usually dropped: <i>Mam pytanie</i> (I have a question). With <b>pan / pani</b> use the 3rd person: <i>Czy pan <b>ma</b> czas?</i></p>`
  },
  {
    level: "A1", title: "The seven cases",
    html: `
<table class="gtable">
<tr><th>Case</th><th>Question</th><th>Main uses</th></tr>
<tr><td>Mianownik<br><span class="muted small">Nominative</span></td><td>kto? co?</td><td>subject; dictionary form</td></tr>
<tr><td>Dopełniacz<br><span class="muted small">Genitive</span></td><td>kogo? czego?</td><td>"of", after negation, quantities, numbers 5+; <i>do, z, od, bez, dla, u, obok</i></td></tr>
<tr><td>Celownik<br><span class="muted small">Dative</span></td><td>komu? czemu?</td><td>indirect object (to/for someone); <i>dzięki, przeciwko</i></td></tr>
<tr><td>Biernik<br><span class="muted small">Accusative</span></td><td>kogo? co?</td><td>direct object; <i>na</i> (where to), <i>przez, za</i> (for)</td></tr>
<tr><td>Narzędnik<br><span class="muted small">Instrumental</span></td><td>kim? czym?</td><td>"with / by means of", after <i>być</i> + noun; <i>z</i> (with), <i>przed, za, nad, pod, między</i></td></tr>
<tr><td>Miejscownik<br><span class="muted small">Locative</span></td><td>o kim? o czym?</td><td>only after <i>w, na, o, przy, po</i> — mostly "where?"</td></tr>
<tr><td>Wołacz<br><span class="muted small">Vocative</span></td><td>—</td><td>addressing someone: <i>Panie Janie! Aniu! Pani Anno!</i></td></tr>
</table>`
  },
  {
    level: "A1", title: "Accusative (direct object)",
    html: `
<table class="gtable">
<tr><th>Noun type</th><th>Change</th><th>Example</th></tr>
<tr><td>Feminine in -a</td><td>-a → <b>-ę</b></td><td>kawa → Poproszę kaw<b>ę</b>.</td></tr>
<tr><td>Masculine, alive</td><td>+ <b>-a</b></td><td>brat → Mam brat<b>a</b>. pies → Mam ps<b>a</b>.</td></tr>
<tr><td>Masculine, thing</td><td>no change</td><td>Kupuję bilet.</td></tr>
<tr><td>Neuter</td><td>no change</td><td>Piję piwo.</td></tr>
</table>
<p>Adjectives follow: <i>Poproszę czarn<b>ą</b> kaw<b>ę</b>. Mam now<b>ego</b> kolegę.</i></p>`
  },
  {
    level: "A1", title: "Personal pronouns",
    html: `
<table class="gtable">
<tr><th>Nom.</th><th>Gen. / Acc.</th><th>Dat.</th><th>Instr.</th><th>Loc.</th></tr>
<tr><td>ja</td><td>mnie</td><td>mi / mnie</td><td>mną</td><td>mnie</td></tr>
<tr><td>ty</td><td>cię / ciebie</td><td>ci / tobie</td><td>tobą</td><td>tobie</td></tr>
<tr><td>on</td><td>go / jego / niego</td><td>mu / jemu / niemu</td><td>nim</td><td>nim</td></tr>
<tr><td>ona</td><td>jej / niej · <i>Acc.</i> ją / nią</td><td>jej / niej</td><td>nią</td><td>niej</td></tr>
<tr><td>my</td><td>nas</td><td>nam</td><td>nami</td><td>nas</td></tr>
<tr><td>wy</td><td>was</td><td>wam</td><td>wami</td><td>was</td></tr>
<tr><td>oni / one</td><td>ich / nich · <i>Acc. one:</i> je / nie</td><td>im / nim</td><td>nimi</td><td>nich</td></tr>
</table>
<p class="muted small">Short forms (<i>cię, mi, go</i>) are the default; long forms are for emphasis. After a preposition use the <b>n-</b> form: <i>z nim, dla niej, o nich</i>.</p>`
  },
  {
    level: "A1", title: "Numbers & złoty",
    html: `
<table class="gtable">
<tr><th>Number ends in…</th><th>Form</th><th>Examples</th></tr>
<tr><td>1 (only the number 1)</td><td>singular</td><td>1 złoty · 1 godzina · 1 bilet</td></tr>
<tr><td>2, 3, 4 (not 12–14)</td><td>nominative plural</td><td>2 złote · 3 godziny · 24 bilety</td></tr>
<tr><td>5–21, 25–31, 0, 12–14…</td><td><b>genitive plural</b></td><td>5 złotych · 12 godzin · 100 biletów</td></tr>
</table>
<p>So: <i>dwadzieścia dwa złote</i> but <i>dwadzieścia pięć złotych</i>. Prices: <i>12,50 zł</i> = <i>dwanaście złotych pięćdziesiąt (groszy)</i>.</p>`
  },
  {
    level: "A2", title: "Past tense",
    html: `
<p>Take the infinitive, drop <b>-ć</b>, add <b>-ł-</b> + a personal ending that also shows <b>gender</b>.</p>
<table class="gtable">
<tr><th></th><th>masculine</th><th>feminine</th></tr>
<tr><td>ja</td><td>robiłem · byłem</td><td>robiłam · byłam</td></tr>
<tr><td>ty</td><td>robiłeś · byłeś</td><td>robiłaś · byłaś</td></tr>
<tr><td>on / ona / ono</td><td>robił · był</td><td>robiła · była · <i>(ono)</i> robiło</td></tr>
<tr><td>my</td><td>robiliśmy · byliśmy</td><td>robiłyśmy · byłyśmy</td></tr>
<tr><td>wy</td><td>robiliście · byliście</td><td>robiłyście · byłyście</td></tr>
<tr><td>oni / one</td><td>robili · byli</td><td>robiły · były</td></tr>
</table>
<p class="muted small">The plural "masculine" (virile) form is used for any group with at least one man. Irregular: <i>iść → szedłem / szłam, jeść → jadłem / jadłam, móc → mogłem / mogłam, mieć → miałem / miałam</i>.</p>`
  },
  {
    level: "A2", title: "Aspect & the future",
    html: `
<p>Most verbs come in pairs: <b>imperfective</b> (process, habit, ongoing) and <b>perfective</b> (one completed result).</p>
<table class="gtable">
<tr><th>Imperfective</th><th>Perfective</th><th>Meaning</th></tr>
<tr><td>robić</td><td>zrobić</td><td>do / make</td></tr>
<tr><td>pisać</td><td>napisać</td><td>write</td></tr>
<tr><td>czytać</td><td>przeczytać</td><td>read</td></tr>
<tr><td>kupować</td><td>kupić</td><td>buy</td></tr>
<tr><td>płacić</td><td>zapłacić</td><td>pay</td></tr>
<tr><td>dawać</td><td>dać</td><td>give</td></tr>
<tr><td>brać</td><td>wziąć</td><td>take</td></tr>
<tr><td>mówić</td><td>powiedzieć</td><td>say / tell</td></tr>
</table>
<table class="gtable">
<tr><th>Future</th><th>Form</th><th>Example</th></tr>
<tr><td>Imperfective</td><td><b>będę</b> + infinitive (or + past form)</td><td>Jutro <b>będę pisać</b> pracę. (I'll be writing)</td></tr>
<tr><td>Perfective</td><td>"present" endings = future</td><td>Jutro <b>napiszę</b> pracę. (I'll get it written)</td></tr>
</table>
<p class="muted small">będę, będziesz, będzie, będziemy, będziecie, będą. Perfective verbs have no present tense.</p>`
  },
  {
    level: "A2", title: "Genitive",
    html: `
<table class="gtable">
<tr><th>Noun</th><th>Ending</th><th>Example</th></tr>
<tr><td>Feminine</td><td>-y / -i</td><td>kawa → kaw<b>y</b> · Polska → Polsk<b>i</b></td></tr>
<tr><td>Masculine</td><td>-a (people, animals, many objects) / -u (abstract, many objects)</td><td>student<b>a</b>, telefon<b>u</b>, dom<b>u</b></td></tr>
<tr><td>Neuter</td><td>-a</td><td>piw<b>a</b>, mieszkani<b>a</b></td></tr>
</table>
<p>Use it after negation (<i>Mam czas → Nie mam czas<b>u</b></i>), for quantities (<i>dużo pracy, kilo jabłek</i>), with numbers 5+, for "of" (<i>dom brat<b>a</b></i>) and after <i>do, z, od, bez, dla, u</i>.</p>`
  },
  {
    level: "A2", title: "Instrumental",
    html: `
<table class="gtable">
<tr><th>Noun</th><th>Ending</th><th>Example</th></tr>
<tr><td>Masculine / neuter</td><td>-em (-iem after k, g)</td><td>Jestem student<b>em</b>. · Jestem Polak<b>iem</b>. · z mlek<b>iem</b></td></tr>
<tr><td>Feminine</td><td>-ą</td><td>Jestem student<b>ką</b>. · z kaw<b>ą</b></td></tr>
<tr><td>Plural</td><td>-ami (-mi)</td><td>z przyjaciel<b>mi</b> · z koleg<b>ami</b></td></tr>
</table>
<p>Uses: <b>być + noun</b> (<i>Jestem lekarzem</i>), <b>z</b> = with (<i>kawa z mlekiem</i>), means of transport (<i>jadę tramwajem</i>), and after <i>przed, za, nad, pod, między</i> for location.</p>`
  },
  {
    level: "A2", title: "Locative",
    html: `
<p>Used only after prepositions: <b>w</b> (in), <b>na</b> (on/at), <b>o</b> (about), <b>przy</b> (near), <b>po</b> (after / around).</p>
<table class="gtable">
<tr><th>Noun ends in…</th><th>Ending</th><th>Example</th></tr>
<tr><td>hard consonant + -a / -o / Ø</td><td><b>-e</b> + consonant softening</td><td>Warszawa → w Warszaw<b>ie</b> · szkoła → w szkol<b>e</b> · Kraków → w Krakow<b>ie</b> · miasto → w mieś<b>cie</b></td></tr>
<tr><td>-k, -g, -ch, soft consonant (masc./neut.)</td><td><b>-u</b></td><td>dom → w dom<b>u</b> · park → w park<b>u</b> · mieszkanie → w mieszkani<b>u</b></td></tr>
<tr><td>-ka, -ga (feminine)</td><td>-ce, -dze</td><td>Polska → w Pols<b>ce</b> · apteka → w apte<b>ce</b></td></tr>
<tr><td>plural</td><td><b>-ach</b></td><td>w sklep<b>ach</b> · o studentk<b>ach</b></td></tr>
</table>`
  },
  {
    level: "A2", title: "Verbs of motion",
    html: `
<table class="gtable">
<tr><th></th><th>On foot, now / one way</th><th>On foot, habitually</th><th>By vehicle, now</th><th>By vehicle, habitually</th></tr>
<tr><td>Infinitive</td><td>iść</td><td>chodzić</td><td>jechać</td><td>jeździć</td></tr>
<tr><td>ja</td><td>idę</td><td>chodzę</td><td>jadę</td><td>jeżdżę</td></tr>
<tr><td>ty</td><td>idziesz</td><td>chodzisz</td><td>jedziesz</td><td>jeździsz</td></tr>
<tr><td>on / ona</td><td>idzie</td><td>chodzi</td><td>jedzie</td><td>jeździ</td></tr>
<tr><td>my</td><td>idziemy</td><td>chodzimy</td><td>jedziemy</td><td>jeździmy</td></tr>
<tr><td>oni</td><td>idą</td><td>chodzą</td><td>jadą</td><td>jeżdżą</td></tr>
</table>
<p><i>Teraz <b>idę</b> na uczelnię.</i> (I'm walking to uni now.) · <i>Codziennie <b>jeżdżę</b> tramwajem.</i> (I go by tram every day.) Going to another city is always <b>jechać</b>.</p>`
  },
  {
    level: "B1", title: "Where & where to: prepositions",
    html: `
<table class="gtable">
<tr><th>Preposition + case</th><th>Meaning</th><th>Example</th></tr>
<tr><td>do + Gen.</td><td>to (into a place / to a person)</td><td>Idę do sklepu. Idę do lekarza.</td></tr>
<tr><td>na + Acc.</td><td>to (events, open places, some institutions)</td><td>Idę na pocztę / na koncert.</td></tr>
<tr><td>w + Loc. · na + Loc.</td><td>in · at / on (location)</td><td>Jestem w sklepie / na poczcie.</td></tr>
<tr><td>z + Gen.</td><td>from, out of</td><td>Wracam ze sklepu / z poczty.</td></tr>
<tr><td>od + Gen.</td><td>from (a person), since</td><td>Wracam od lekarza. Od poniedziałku.</td></tr>
<tr><td>u + Gen.</td><td>at someone's place</td><td>Jestem u lekarza / u babci.</td></tr>
<tr><td>z + Instr.</td><td>with</td><td>Kawa z mlekiem. Idę z Anią.</td></tr>
<tr><td>bez · dla + Gen.</td><td>without · for</td><td>bez cukru · dla ciebie</td></tr>
<tr><td>o + Loc. · o + Acc.</td><td>about · for (asking)</td><td>Mówimy o Polsce. Proszę o rachunek.</td></tr>
<tr><td>po + Acc.</td><td>to get, to fetch</td><td>Idę po chleb.</td></tr>
<tr><td>przez + Acc.</td><td>through; for (duration)</td><td>przez park · przez tydzień</td></tr>
<tr><td>za + Acc. · za + Instr.</td><td>for (payment, thanks) · behind</td><td>Dziękuję za pomoc. · za domem</td></tr>
</table>`
  },
  {
    level: "B1", title: "Conditional",
    html: `
<p>Past-tense stem + <b>-by-</b> + ending. Used for wishes, hypotheticals and polite requests.</p>
<table class="gtable">
<tr><th></th><th>masculine</th><th>feminine</th></tr>
<tr><td>ja</td><td>chciałbym</td><td>chciałabym</td></tr>
<tr><td>ty</td><td>chciałbyś</td><td>chciałabyś</td></tr>
<tr><td>on / ona</td><td>chciałby</td><td>chciałaby</td></tr>
<tr><td>my</td><td>chcielibyśmy</td><td>chciałybyśmy</td></tr>
<tr><td>wy</td><td>chcielibyście</td><td>chciałybyście</td></tr>
<tr><td>oni / one</td><td>chcieliby</td><td>chciałyby</td></tr>
</table>
<p><i><b>Chciałbym</b> zapytać o termin.</i> (I'd like to ask about an appointment.) · <i><b>Gdybym</b> miał czas, <b>pojechałbym</b> do Gdańska.</i> (If I had time, I'd go to Gdańsk.) · <i>Czy <b>mógłby</b> pan powtórzyć?</i> (Could you repeat?)</p>`
  },
  {
    level: "B1", title: "Imperative",
    html: `
<table class="gtable">
<tr><th>Infinitive</th><th>3rd pl. present</th><th>ty</th><th>wy</th><th>my (let's)</th></tr>
<tr><td>czytać</td><td>czytają</td><td>czytaj!</td><td>czytajcie!</td><td>czytajmy!</td></tr>
<tr><td>robić</td><td>robią</td><td>rób!</td><td>róbcie!</td><td>róbmy!</td></tr>
<tr><td>pisać</td><td>piszą</td><td>pisz!</td><td>piszcie!</td><td>piszmy!</td></tr>
<tr><td>iść</td><td>idą</td><td>idź!</td><td>idźcie!</td><td>idźmy!</td></tr>
<tr><td>jeść</td><td>jedzą</td><td>jedz!</td><td>jedzcie!</td><td>jedzmy!</td></tr>
<tr><td>być</td><td>są</td><td>bądź!</td><td>bądźcie!</td><td>bądźmy!</td></tr>
</table>
<p>Polite forms: <b>Proszę</b> + infinitive (<i>Proszę usiąść</i> — please sit down) or <b>Niech pan / pani</b> + 3rd person (<i>Niech pan poczeka</i>). Negative orders usually use the imperfective: <i>Nie rób tego!</i></p>`
  },
  {
    level: "B2", title: "Impersonal forms & participles",
    html: `
<table class="gtable">
<tr><th>Form</th><th>Meaning</th><th>Example</th></tr>
<tr><td>-no / -to</td><td>it was done (no subject)</td><td>Zamknięto sklep. Zrobiono błąd.</td></tr>
<tr><td>się + 3rd sg.</td><td>one does / people do</td><td>Tak się mówi. Tu się nie pali.</td></tr>
<tr><td>można · trzeba · wolno · warto + inf.</td><td>one can · must · may · it's worth</td><td>Tu można płacić kartą. Trzeba się zarejestrować.</td></tr>
<tr><td>-ący (active adj. participle)</td><td>…-ing (who does)</td><td>czytający student — the student who is reading</td></tr>
<tr><td>-ny / -ty (passive participle)</td><td>…-ed (which is done)</td><td>przeczytana książka — the book that has been read</td></tr>
<tr><td>-ąc (contemporary adverbial)</td><td>while …-ing</td><td>Czytając, piję kawę.</td></tr>
<tr><td>-wszy / -łszy (anterior adverbial)</td><td>having …-ed</td><td>Przeczytawszy list, wyszedł.</td></tr>
</table>`
  }
];

window.GRAMMAR = GRAMMAR;
