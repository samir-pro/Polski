/* ============================================================================
 * Life in Poland — a practical survival guide for international students.
 *
 * Always open (never locked). Each section has short practical tips plus
 * key phrases with audio. Rules change over time, so tips point you to the
 * office that has the final word rather than quoting fees or deadlines.
 *
 * Data model per section:
 *   { icon, title, tips: [html, ...], phrases: [ [polish, english], ... ] }
 * ========================================================================== */

const GUIDE = [
  {
    icon: "🆘", title: "Emergencies",
    tips: [
      "<b>112</b> — the general emergency number. It's free and operators speak English.",
      "<b>999</b> ambulance · <b>997</b> police · <b>998</b> fire brigade.",
      "For non-urgent illness at night or at weekends, look for <b>nocna i świąteczna opieka zdrowotna</b> (out-of-hours care) instead of A&E (<b>SOR</b>).",
      "Pharmacies (<b>apteka</b>) have a green cross; big cities have at least one open 24/7."
    ],
    phrases: [["Pomocy!","Help!"],["Proszę wezwać karetkę!","Please call an ambulance!"],["Zgubiłem się.","I'm lost. (m.)"],["Zgubiłam się.","I'm lost. (f.)"],["Ukradli mi telefon.","My phone was stolen."],["Gdzie jest najbliższy szpital?","Where is the nearest hospital?"],["Mam alergię na penicylinę.","I'm allergic to penicillin."]]
  },
  {
    icon: "🪪", title: "Visa, Residence & PESEL",
    tips: [
      "Non-EU students who stay longer than their visa allows apply for a <b>karta pobytu</b> (temporary residence card) at the <b>Urząd Wojewódzki</b> of the region where they live. Submit the application <i>while your visa or stay is still valid</i> — keep the confirmation of submission.",
      "Typical documents: passport, photos, proof of student status (<b>zaświadczenie o studiowaniu</b>), health insurance, proof of address and money. Check the current list on your Urząd Wojewódzki's website — it changes.",
      "EU students don't need a visa, but must <b>register their stay</b> if staying over 3 months.",
      "A <b>PESEL</b> number makes life easier (banks, doctors, contracts). Ask your local city/town office (<b>urząd miasta / gminy</b>).",
      "<b>Zameldowanie</b> = registering your address. Your landlord's cooperation is needed — ask about it before you sign."
    ],
    phrases: [["Chcę złożyć wniosek o kartę pobytu.","I want to apply for a residence card."],["Jakie dokumenty są potrzebne?","Which documents are needed?"],["Czy mogę umówić termin?","Can I book an appointment?"],["Chciałbym otrzymać numer PESEL.","I'd like to get a PESEL number. (m.)"],["Czy jest ktoś, kto mówi po angielsku?","Is there anyone who speaks English?"],["Proszę o potwierdzenie złożenia wniosku.","I'd like confirmation that the application was submitted."]]
  },
  {
    icon: "🎓", title: "University Life",
    tips: [
      "The <b>dziekanat</b> (dean's office) handles enrolment, certificates and student ID. Check its opening hours — often only a few hours a day.",
      "Grades, timetable and registration live in an online system — at most universities it's <b>USOS</b>.",
      "Your <b>legitymacja studencka</b> (student ID) gives discounts on transport, museums and cinemas — many apply until age 26.",
      "Polish grades: <b>2</b> = fail, <b>3</b> = satisfactory, <b>4</b> = good, <b>5</b> = very good. Fail? There's a <b>poprawka</b> (resit).",
      "Address lecturers by title: <i>Panie Profesorze</i>, <i>Pani Doktor</i>. Write emails formally."
    ],
    phrases: [["Gdzie jest dziekanat?","Where is the dean's office?"],["Potrzebuję zaświadczenia o studiowaniu.","I need a certificate of student status."],["Kiedy są pana dyżury?","When are your office hours? (to a man)"],["Czy mogę oddać pracę później?","Can I hand in the work later?"],["Nie było mnie na zajęciach, bo byłem chory.","I missed class because I was ill. (m.)"],["Gdzie jest biuro współpracy międzynarodowej?","Where is the international office?"]]
  },
  {
    icon: "🏠", title: "Finding a Room or Flat",
    tips: [
      "Ask your university about the <b>akademik</b> (dorm) first — it's the cheapest option.",
      "Private rentals: compare <b>czynsz</b> (rent) + <b>media</b> (utilities) + <b>kaucja</b> (deposit, often one month's rent).",
      "Always get a written <b>umowa najmu</b> (tenancy agreement), check the <b>okres wypowiedzenia</b> (notice period), and photograph the flat when you move in.",
      "Never send a deposit before seeing the flat (in person or by live video call) — rental scams exist.",
      "Quiet hours (<b>cisza nocna</b>) are usually 22:00–6:00."
    ],
    phrases: [["Czy pokój jest jeszcze dostępny?","Is the room still available?"],["Ile wynosi czynsz z mediami?","How much is the rent including utilities?"],["Czy mogę obejrzeć mieszkanie?","Can I view the flat?"],["Jak długi jest okres wypowiedzenia?","How long is the notice period?"],["Czy mogę się tu zameldować?","Can I register my address here?"],["Kaloryfer nie działa.","The radiator isn't working."]]
  },
  {
    icon: "🏦", title: "Money & Banking",
    tips: [
      "Currency: <b>złoty</b> (PLN, zł). 1 zł = 100 groszy.",
      "To open an account bring your passport; many banks also ask for a PESEL or student status. Several banks have free student accounts.",
      "<b>BLIK</b> is everywhere: a 6-digit code from your banking app to pay in shops, online, at ATMs, or to send money to a friend's phone number.",
      "Contactless card payments are accepted almost everywhere. Avoid exchange booths at airports — city <b>kantory</b> give much better rates.",
      "When an ATM offers to 'convert' your foreign card payment, choose to pay in <b>PLN</b> — it's usually cheaper."
    ],
    phrases: [["Chciałbym założyć konto studenckie.","I'd like to open a student account. (m.)"],["Czy mogę zapłacić BLIK-iem?","Can I pay with BLIK?"],["Gdzie jest najbliższy bankomat?","Where is the nearest ATM?"],["Wyślę ci na BLIK-a.","I'll send it to you via BLIK."],["Jaki jest kurs euro?","What's the euro exchange rate?"],["Moja karta nie działa.","My card isn't working."]]
  },
  {
    icon: "🚋", title: "Getting Around",
    tips: [
      "Buy tickets before boarding (machine, kiosk or app) and <b>validate</b> paper tickets in the box on board. Inspectors are frequent; fines are high.",
      "Students with a Polish student ID usually ride at a <b>reduced fare</b> (ulgowy) — check your city's rules. Carry the ID with you!",
      "Trains: <b>PKP Intercity</b> for long distance, regional operators for local lines. Students under 26 with a Polish student ID get large discounts.",
      "To pass someone on a crowded tram, ask: <i>Czy pan/pani wysiada?</i> (Are you getting off?)"
    ],
    phrases: [["Poproszę bilet ulgowy.","A reduced-fare ticket, please."],["Czy ten tramwaj jedzie do centrum?","Does this tram go to the centre?"],["Na którym przystanku mam wysiąść?","At which stop should I get off?"],["Czy pani wysiada?","Are you getting off? (to a woman)"],["Z którego peronu odjeżdża pociąg?","Which platform does the train leave from?"],["Pociąg jest opóźniony.","The train is delayed."]]
  },
  {
    icon: "🛒", title: "Shopping & Daily Errands",
    tips: [
      "Most big shops are <b>closed on most Sundays</b> (niedziela niehandlowa). Small convenience stores like <b>Żabka</b> and petrol stations stay open.",
      "Supermarkets: <b>Biedronka</b>, <b>Lidl</b> and others. Look for <b>promocja</b> (offers) and loyalty apps.",
      "Many plastic bottles, cans and glass bottles carry a deposit (<b>kaucja</b>) — the label shows it. Return them to shops for a refund.",
      "Rubbish is sorted by colour: yellow = plastic & metal, blue = paper, green = glass, brown = bio, black = mixed.",
      "Parcels often go to a <b>paczkomat</b> (parcel locker) — you get a pickup code by SMS/app."
    ],
    phrases: [["Czy jest otwarte w niedzielę?","Is it open on Sunday?"],["Poproszę torbę.","A bag, please."],["Gdzie mogę oddać butelki?","Where can I return bottles?"],["Czy mogę to zwrócić?","Can I return this?"],["Nie potrzebuję paragonu.","I don't need the receipt."],["Gdzie jest najbliższy paczkomat?","Where is the nearest parcel locker?"]]
  },
  {
    icon: "🏥", title: "Health & Insurance",
    tips: [
      "Public healthcare is run by <b>NFZ</b>. EU students: bring your <b>EHIC</b> card. Non-EU students: you need health insurance for your residence permit — options include private insurance or voluntary NFZ insurance; ask your international office.",
      "Register at a <b>przychodnia</b> (clinic) to see a GP (<b>lekarz rodzinny</b>). Specialists usually need a <b>skierowanie</b> (referral) on NFZ.",
      "Prescriptions are electronic (<b>e-recepta</b>): you get a 4-digit code by SMS or email to show at any pharmacy.",
      "Private clinics are widely used — faster, with English-speaking doctors, but you pay per visit or via a package.",
      "Free psychological support is offered by many universities — don't hesitate to use it."
    ],
    phrases: [["Chciałbym zapisać się do lekarza.","I'd like to book a doctor's appointment. (m.)"],["Czy lekarz mówi po angielsku?","Does the doctor speak English?"],["Mam ubezpieczenie NFZ.","I have NFZ insurance."],["Boli mnie tutaj.","It hurts here."],["Od kiedy ma pan te objawy?","How long have you had these symptoms? (doctor to a man)"],["Czy potrzebuję recepty?","Do I need a prescription?"]]
  },
  {
    icon: "📱", title: "Phone & Internet",
    tips: [
      "Prepaid SIM cards (<b>na kartę</b>) are cheap but must be <b>registered with ID</b> — the shop or operator does it with your passport.",
      "Top up (<b>doładowanie</b>) online, in the app, or at any Żabka / kiosk.",
      "EU roaming rules apply — an EU SIM works in Poland at home prices, within fair-use limits.",
      "Most cafés and universities have free wifi; eduroam works at Polish universities."
    ],
    phrases: [["Chcę kupić kartę SIM na kartę.","I want to buy a prepaid SIM."],["Jak doładować telefon?","How do I top up my phone?"],["Jakie jest hasło do wifi?","What's the wifi password?"],["Nie mam zasięgu.","I have no signal."],["Czy mogę tu naładować telefon?","Can I charge my phone here?"]]
  },
  {
    icon: "💼", title: "Working as a Student",
    tips: [
      "Full-time students at Polish universities can usually work without a separate work permit — but your rights depend on your residence status, so check with your international office or Urząd Wojewódzki first.",
      "Common contracts: <b>umowa o pracę</b> (employment contract, with paid leave), <b>umowa zlecenie</b> (very common for students). Always read before signing.",
      "Pay is quoted <b>brutto</b> (before tax) or <b>netto</b> (take-home). Ask which!",
      "Each spring, you may need to file a <b>PIT</b> tax return — your employer sends you a PIT-11 form."
    ],
    phrases: [["Szukam pracy dorywczej.","I'm looking for a part-time job."],["Czy to stawka brutto czy netto?","Is that rate gross or net?"],["Jaki to rodzaj umowy?","What kind of contract is it?"],["Ile godzin tygodniowo?","How many hours a week?"],["Kiedy jest wypłata?","When is payday?"]]
  },
  {
    icon: "🤝", title: "Culture & Etiquette",
    tips: [
      "Use <b>pan / pani</b> with strangers, officials and teachers until they suggest first names (<i>Mówmy sobie po imieniu</i>).",
      "At someone's home: take off your shoes, bring something small (flowers, chocolates, wine). Flowers in an <b>odd number</b> — even numbers are for funerals.",
      "When offered food, expect to be offered again (and again). <b>Smacznego!</b> before eating, <b>Na zdrowie!</b> when toasting.",
      "Name days (<b>imieniny</b>) are celebrated like birthdays — check the calendar for your Polish friends' names.",
      "Small talk: Poles appreciate any effort in Polish — even <i>Dzień dobry</i> and <i>Dziękuję</i> go a long way."
    ],
    phrases: [["Mówmy sobie po imieniu.","Let's use first names."],["Dziękuję za zaproszenie.","Thank you for the invitation."],["To dla pani.","This is for you. (to a woman)"],["Smacznego!","Enjoy your meal!"],["Wszystkiego najlepszego z okazji imienin!","Happy name day!"],["Przepraszam, dopiero się uczę polskiego.","Sorry, I'm still learning Polish."]]
  }
];

window.GUIDE = GUIDE;
