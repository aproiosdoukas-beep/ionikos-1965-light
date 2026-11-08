/* ==========================================================================
   ΙΩΝΙΚΟΣ 1965 :: Demo data (seed)
   Δεν υπάρχει backend. Όλα τα δεδομένα ζουν εδώ και στο localStorage.
   ========================================================================== */
(function (global) {
  "use strict";

  /* ---- Λογαριασμοί επίδειξης -------------------------------------------
     Είναι δημόσια στοιχεία επίδειξης για το mockup, όχι πραγματικοί κωδικοί. */
  const ACCOUNTS = [
    {
      id: "u_maria",
      email: "maria@ionikos.gr",
      password: "ionikos1965",
      role: "member",
      displayName: "Μαρία Κωνσταντίνου",
      memberSince: "2026-07-01",
      profiles: ["p_maria"]
    },
    {
      id: "u_giorgos",
      email: "giorgos@ionikos.gr",
      password: "ionikos1965",
      role: "member",
      displayName: "Γιώργος Παπαδόπουλος",
      memberSince: "2025-03-01",
      profiles: ["p_giorgos", "p_kostis"]
    },
    {
      id: "u_admin",
      email: "admin@ionikos.gr",
      password: "admin1965",
      role: "admin",
      displayName: "Γραφείο Συλλόγου",
      profiles: []
    },
    {
      id: "u_gate",
      email: "gate@ionikos.gr",
      password: "gate1965",
      role: "gate",
      displayName: "Προσωπικό Θύρας 1",
      profiles: []
    },
    {
      id: "u_shop",
      email: "shop@ionikos.gr",
      password: "shop1965",
      role: "merchant",
      displayName: "Nikaia Burgers",
      merchantId: "m_burgers",
      profiles: []
    }
  ];

  /* ---- Προφίλ οικογένειας ----------------------------------------------- */
  const PROFILES = {
    p_maria: {
      id: "p_maria",
      shortName: "Μαρία",
      fullName: "Μαρία Κωνσταντίνου",
      kind: "adult",
      kindLabel: "Μέλος",
      cardCode: "ION-2190",
      levelId: "casual",
      monthsMember: 4,
      status: "active",
      statusLabel: "ΕΝΕΡΓΗ",
      monthlyFee: 20.0,
      discountLabel: null
    },
    p_giorgos: {
      id: "p_giorgos",
      shortName: "Γιώργος",
      fullName: "Γιώργος Παπαδόπουλος",
      kind: "adult",
      kindLabel: "Γονέας",
      cardCode: "ION-8472",
      levelId: "hooligan",
      monthsMember: 8,
      status: "active",
      statusLabel: "ΕΝΕΡΓΗ",
      monthlyFee: 20.0,
      discountLabel: null
    },
    p_kostis: {
      id: "p_kostis",
      shortName: "Κωστής",
      fullName: "Κωστής Παπαδόπουλος",
      kind: "academy",
      kindLabel: "Κ14",
      squad: "ΑΚΑΔΗΜΙΑ Κ14",
      cardCode: "ION-5513",
      levelId: "touristas",
      monthsMember: 5,
      status: "approved",
      statusLabel: "ΕΓΚΕΚΡΙΜΕΝΟ",
      monthlyFee: 10.0,
      discountLabel: "Εγκεκριμένη Έκπτωση Ακαδημίας (-50%)",
      parentConsentStream: true
    }
  };

  /* ---- Τα 6 επίπεδα πιστότητας (κερκίδα) --------------------------------- */
  const LEVELS = [
    { id: "touristas", order: 1, name: "Τουρίστας", en: "",  range: "0-2 ΜΗΝΕΣ",   minMonths: 0,  perk: "Ψηφιακή Κάρτα & Εκπτώσεις" },
    { id: "casual",    order: 2, name: "Casual",    en: "",  range: "3-5 ΜΗΝΕΣ",   minMonths: 3,  perk: "Ξεχωριστό Χρώμα στο Chat" },
    { id: "hooligan",  order: 3, name: "Hooligan",  en: "",  range: "6-11 ΜΗΝΕΣ",  minMonths: 6,  perk: "Προτεραιότητα Εισιτηρίων Event" },
    { id: "firm",      order: 4, name: "Firm",      en: "",  range: "12-17 ΜΗΝΕΣ", minMonths: 12, perk: "Ομαδικές Μετακινήσεις Εκτός Έδρας" },
    { id: "ranger",    order: 5, name: "Ranger",    en: "",  range: "18-23 ΜΗΝΕΣ", minMonths: 18, perk: "Συναντήσεις με Παίκτες" },
    { id: "ultra",     order: 6, name: "Ultra",     en: "",  range: "24+ ΜΗΝΕΣ",   minMonths: 24, perk: "Αναγραφή Ονόματος στο Γήπεδο" }
  ];

  /* ---- Τρόπαια: επιβράβευση για ό,τι κάνει ο φίλαθλος ------------------
     action: ο μετρητής που ανεβαίνει. shops = διαφορετικοί χορηγοί,
     months = μήνες συνδρομής, all = όλα τα υπόλοιπα τρόπαια. */
  const TIERS = {
    bronze:   { label: "Χάλκινο" },
    silver:   { label: "Ασημένιο" },
    gold:     { label: "Χρυσό" },
    platinum: { label: "Πλατινένιο" }
  };

  const TROPHIES = [
    { id: "first_voice",    name: "Πρώτη ιαχή",             tier: "bronze",   icon: "chat",   action: "chat",   goal: 1,  text: "Γράψατε το πρώτο σας μήνυμα στην κερκίδα." },
    { id: "stand_voice",    name: "Ο Κάπο",                 tier: "silver",   icon: "chat",   action: "chat",   goal: 25, text: "Γράψατε 25 μηνύματα στην κερκίδα. Το σύνθημα το ξεκινάτε εσείς." },
    { id: "voter",          name: "Ο Σκάουτερ",             tier: "bronze",   icon: "check",  action: "vote",   goal: 1,  text: "Ψηφίσατε τον MVP ενός αγώνα." },
    { id: "customer",       name: "Πεινασμένος για νίκες",  tier: "bronze",   icon: "tag",    action: "redeem", goal: 1,  text: "Εξαργυρώσατε την πρώτη σας προσφορά σε χορηγό." },
    { id: "loyal_customer", name: "Ο Δήμαρχος της Νίκαιας", tier: "silver",   icon: "store",  action: "shops",  goal: 4,  text: "Εξαργυρώσατε προσφορά και στους 4 χορηγούς του συλλόγου." },
    { id: "present",        name: "Παιδί της θύρας",        tier: "silver",   icon: "ticket", action: "gate",   goal: 10, text: "Μπήκατε σε 10 εντός έδρας αγώνες." },
    { id: "ever_present",   name: "Θρύλος της θύρας",       tier: "gold",     icon: "ticket", action: "gate",   goal: 30, text: "Μπήκατε σε 30 εντός έδρας αγώνες. Η θέση στη θύρα είναι πια δική σας." },
    { id: "traveler",       name: "Ο Νομάδας",              tier: "silver",   icon: "bus",    action: "away",   goal: 3,  text: "Ακολουθήσατε την ομάδα σε 3 εκτός έδρας αγώνες." },
    { id: "ticket",         name: "Πρώτη σειρά",            tier: "bronze",   icon: "ticket", action: "ticket", goal: 1,  text: "Κλείσατε το πρώτο σας εισιτήριο σε εκδήλωση του συλλόγου." },
    { id: "viewer",         name: "Ο Αναλυτής",             tier: "bronze",   icon: "play",   action: "watch",  goal: 1,  text: "Είδατε αγώνα ζωντανά στο Ιωνικός TV." },
    { id: "loyal",          name: "Μπλε αίμα",              tier: "gold",     icon: "shield", action: "months", goal: 12, text: "Συμπληρώσατε έναν χρόνο ως μέλος του Ιωνικού." },
    { id: "oracle",         name: "Ο Μάντης",               tier: "bronze",   icon: "check",  action: "predict_hit", goal: 1, text: "Βρήκατε το ακριβές σκορ ενός αγώνα." },
    { id: "since_1965",     name: "Ψυχή του Ιωνικού",       tier: "platinum", icon: "medal",  action: "all",    goal: 12, text: "Κατακτήσατε όλα τα υπόλοιπα τρόπαια." }
  ];

  /* Αρχικοί μετρητές επίδειξης: κάτι ξεκλειδώνει με ένα πάτημα. */
  const TROPHY_SEED = {
    p_giorgos: { counts: { chat: 24, gate: 9, redeem: 4, away: 2 }, shops: ["m_square", "m_boutique", "m_gym"] },
    p_maria:   { counts: { gate: 2, redeem: 1 }, shops: ["m_square"] },
    p_kostis:  { counts: {}, shops: [] }
  };

  /* ---- Κατάταξη φιλάθλων εβδομάδας (δεδομένα επίδειξης) -------------------- */
  const FANS = [
    { name: "Μάκης Ρούσσος",     levelId: "ultra",     title: "ever_present",   points: 246 },
    { name: "Σπύρος Αλεξίου",    levelId: "ultra",     title: "loyal",          points: 212 },
    { name: "Βαγγέλης Μαυρίδης", levelId: "ranger",    title: "stand_voice",    points: 188 },
    { name: "Νίκος Δρόσος",      levelId: "hooligan",  title: "stand_voice",    points: 154 },
    { name: "Άννα Κυριακού",     levelId: "firm",      title: "voter",          points: 131 },
    { name: "Κώστας Λιάπης",     levelId: "ultra",     title: "present",        points: 117 },
    { name: "Σταύρος Πετρίδης",  levelId: "firm",      title: "traveler",       points: 96 },
    { name: "Ελένη Μαργαρίτη",   levelId: "hooligan",  title: "ticket",         points: 83 },
    { name: "Θανάσης Ζαφείρης",  levelId: "hooligan",  title: "viewer",         points: 71 },
    { name: "Δημήτρης Βλάχος",   levelId: "casual",    title: "customer",       points: 58 },
    { name: "Μαρία Λαμπράκη",    levelId: "casual",    title: "first_voice",    points: 39 },
    { name: "Λάκης Χατζής",      levelId: "touristas", title: "first_voice",    points: 22 }
  ];

  /* ---- Εκδρομή εκτός έδρας (δεδομένα επίδειξης) --------------------------- */
  const AWAY_TRIP = {
    id: "trip_rhodes",
    title: "Λεωφορείο οπαδών",
    match: "Διαγόρας - Ιωνικός",
    destination: "Ρόδος, με πλοίο από τον Πειραιά",
    date: "29/11/2026",
    time: "07:30",
    meet: "Πλατεία Νίκαιας",
    seats: 50,
    taken: 37,
    price: 15
  };

  /* ---- Ιστορία του συλλόγου -----------------------------------------------
     Μόνο στοιχεία που αναφέρουν οι πηγές. Ό,τι αμφισβητείται, λείπει. */
  const HISTORY = {
    intro: "Ο Ιωνικός γεννήθηκε το 1965 στη Νίκαια, από τη συνένωση της Α.Ε. Νικαίας και του Άρη Πειραιώς. Από τότε παίζει στο Γήπεδο Νεάπολης και έχει περάσει από τα τοπικά πρωταθλήματα ως τον τελικό του Κυπέλλου και την Ευρώπη.",
    facts: [
      { label: "Ίδρυση", value: "29 Ιουνίου 1965, από τη συνένωση της Α.Ε. Νικαίας και του Α.Π.Σ. Άρη Πειραιώς" },
      { label: "Χρώματα", value: "μπλε και λευκό, γι' αυτό και «Κυανόλευκοι». Λέγονται και «Κοκκινιώτες»" },
      { label: "Έδρα", value: "Δημοτικό Γήπεδο Νεάπολης Νίκαιας, 5.500 θέσεις. Το μπάσκετ παίζει στο κλειστό «Παναγιώτης Γιαννάκης»" }
    ],
    timeline: [
      { year: "1965", sport: "club", source: "el_club", title: "Ο σύλλογος γεννιέται",
        text: "Η Α.Ε. Νικαίας και ο Άρης Πειραιώς ενώνονται και γίνονται ο Ιωνικός." },
      { year: "1965-66", sport: "football", source: "el_football", title: "Πρώτη χρονιά στη Β΄ Εθνική",
        text: "Ο πρώτος επίσημος αγώνας, στις 21 Νοεμβρίου 1965, λήγει 0-0 με τον Ατρόμητο Πειραιά." },
      { year: "1974-75", sport: "basketball", source: "el_basketball", title: "Το μπάσκετ ανεβαίνει ψηλά",
        text: "Μέσα από μπαράζ, η ομάδα μπάσκετ ανεβαίνει στην πρώτη εθνική κατηγορία και μένει εκεί για πάνω από δέκα χρόνια." },
      { year: "1976", sport: "basketball", source: "el_basketball", title: "Πανελλήνιοι πρωταθλητές νέων",
        text: "Η ομάδα νέων κατακτά το πανελλήνιο πρωτάθλημα. Την ίδια χρονιά ο 17χρονος Παναγιώτης Γιαννάκης κάνει ντεμπούτο στην Εθνική ομάδα." },
      { year: "1981-82", sport: "football", source: "el_football", title: "Πρωταθλητές Γ΄ Εθνικής",
        text: "Ο Ιωνικός κερδίζει το πρωτάθλημα της Γ΄ Εθνικής και επιστρέφει στη Β΄." },
      { year: "1983-84", sport: "basketball", source: "el_basketball", title: "Οι 73 πόντοι του Γιαννάκη",
        text: "Σε παράταση απέναντι στον Άρη στη Νίκαια, ο Γιαννάκης βάζει 73 πόντους, ρεκόρ του συλλόγου." },
      { year: "1988-89", sport: "football", source: "el_football", title: "Για πρώτη φορά στην Α΄ Εθνική",
        text: "Με την τρίτη θέση στη Β΄ Εθνική, ο Ιωνικός ανεβαίνει για πρώτη φορά στη μεγάλη κατηγορία." },
      { year: "1999-2000", sport: "football", source: "en_football", title: "Ο Ιωνικός στην Ευρώπη",
        text: "Πρώτη και μοναδική ως τώρα συμμετοχή στο Κύπελλο UEFA, απέναντι στη Ναντ (1-3 και 0-1)." },
      { year: "2000", sport: "football", source: "en_football", title: "Τελικός Κυπέλλου Ελλάδας",
        text: "Ο Ιωνικός φτάνει στον τελικό του Κυπέλλου και χάνει 0-3 από την ΑΕΚ. Περίπου 5.000 Ιωνικοί στις εξέδρες." },
      { year: "2011", sport: "football", source: "en_football", title: "Η ομάδα περνά στους φιλάθλους",
        text: "Μετά τα οικονομικά προβλήματα, την ομάδα αναλαμβάνει ο σύνδεσμος φιλάθλων «Rangers Club». Μοναδικό μοντέλο στην Ελλάδα." },
      { year: "2020-21", sport: "football", source: "en_football", title: "Πρωταθλητές Super League 2",
        text: "Ο Ιωνικός κερδίζει το πρωτάθλημα και επιστρέφει στη μεγάλη κατηγορία ύστερα από 14 χρόνια." },
      { year: "2024-25", sport: "football", source: "en_football", title: "Νέα αρχή από τον Πειραιά",
        text: "Πρωτάθλημα στην Α΄ κατηγορία της ΕΠΣ Πειραιά και άνοδος στη Γ΄ Εθνική." }
    ],
    sections: ["Ποδόσφαιρο", "Μπάσκετ ανδρών και γυναικών", "Βόλεϊ ανδρών και γυναικών", "Πόλο ανδρών και γυναικών",
               "Κολύμβηση", "Άρση βαρών", "Πυγμαχία", "Τένις", "Softball", "Esports"],
    sources: [
      { id: "el_football",   name: "Βικιπαίδεια: Ιωνικός Νίκαιας (ποδόσφαιρο)", url: "https://el.wikipedia.org/wiki/%CE%99%CF%89%CE%BD%CE%B9%CE%BA%CF%8C%CF%82_%CE%9D%CE%AF%CE%BA%CE%B1%CE%B9%CE%B1%CF%82_(%CF%80%CE%BF%CE%B4%CF%8C%CF%83%CF%86%CE%B1%CE%B9%CF%81%CE%BF)" },
      { id: "en_football",   name: "Wikipedia: Ionikos F.C.", url: "https://en.wikipedia.org/wiki/Ionikos_F.C." },
      { id: "el_club",       name: "Βικιπαίδεια: Α.Ο. Ιωνικός Νίκαιας", url: "https://el.wikipedia.org/wiki/%CE%91.%CE%9F._%CE%99%CF%89%CE%BD%CE%B9%CE%BA%CF%8C%CF%82_%CE%9D%CE%AF%CE%BA%CE%B1%CE%B9%CE%B1%CF%82" },
      { id: "el_basketball", name: "Βικιπαίδεια: Ιωνικός Νίκαιας (μπάσκετ ανδρών)", url: "https://el.wikipedia.org/wiki/%CE%99%CF%89%CE%BD%CE%B9%CE%BA%CF%8C%CF%82_%CE%9D%CE%AF%CE%BA%CE%B1%CE%B9%CE%B1%CF%82_(%CE%BA%CE%B1%CE%BB%CE%B1%CE%B8%CE%BF%CF%83%CF%86%CE%B1%CE%AF%CF%81%CE%B9%CF%83%CE%B7_%CE%B1%CE%BD%CE%B4%CF%81%CF%8E%CE%BD)" },
      { id: "club_site",     name: "ionikos.gr", url: "https://ionikos.gr/" }
    ]
  };

  /* ---- Χορηγοί & προσφορές  ------------------------------------ */
  const OFFERS = [
    { id: "m_burgers",  name: "Nikaia Burgers",   category: "food",  icon: "🍔",
      discount: "-15%", headline: "-15% σε όλα τα μενού",
      meta: "Απομένουν 3/4 χρήσεις", usesLeft: 3, usesTotal: 4, featured: true },
    { id: "m_square",   name: "Square Cafe",      category: "food",  icon: "☕",
      discount: "-20%", headline: "-20% Καφές & Σνακ",
      meta: "Καθημερινά 08:00-14:00", usesLeft: 4, usesTotal: 4 },
    { id: "m_boutique", name: "Μπουτίκ Ιωνικού",  category: "shop",  icon: "👕",
      discount: "-10%", headline: "-10% Εμφανίσεις",
      meta: "Επίσημη εμφάνιση 2026", usesLeft: 2, usesTotal: 4 },
    { id: "m_gym",      name: "Blue Gym Νίκαια",  category: "shop",  icon: "🏋️",
      discount: "ΔΩΡΕΑΝ", headline: "Δωρεάν Εγγραφή",
      meta: "Νέα μέλη, μία φορά", usesLeft: 1, usesTotal: 1 }
  ];

  const OFFER_FILTERS = [
    { id: "all",  label: "Όλα" },
    { id: "food", label: "Εστίαση" },
    { id: "shop", label: "Αγορές" }
  ];

  /* ---- Live & VOD  --------------------------------------------- */
  const LIVE = {
    id: "match_k16",
    competition: "Πρωτάθλημα Κ16",
    title: "Ιωνικός vs Προοδευτική",
    score: "2-1",
    quality: "720p HD",
    clock: "64:18",
    period: "Β′ Ημίχρονο",
    camera: "Κεντρική Κάμερα Γηπέδου",
    watching: 312,
    stand: 184
  };

  /* ---- Αντιδράσεις στο live ------------------------------------------------ */
  const REACTIONS = [
    { id: "goal",  emoji: "⚽", label: "Γκολ" },
    { id: "fire",  emoji: "🔥", label: "Φωτιά" },
    { id: "heart", emoji: "💙", label: "Μπλε καρδιά" },
    { id: "clap",  emoji: "👏", label: "Χειροκρότημα" }
  ];

  const VOD = [
    { id: "vod1", title: "Κ14 Ιωνικός - Ατρόμητος", score: "3-0", date: "02/11/2026", dur: "92'" },
    { id: "vod2", title: "Κ12 Ιωνικός - Εθνικός",   score: "1-1", date: "26/10/2026", dur: "88'" },
    { id: "vod3", title: "Κ16 Ιωνικός - Ηρακλής",   score: "2-2", date: "19/10/2026", dur: "95'" },
    { id: "vod4", title: "Κ14 Ιωνικός - Αίας",      score: "4-1", date: "12/10/2026", dur: "90'" }
  ];

  const CHAT_ROOMS = [
    { id: "match",     label: "Αγώνας" },
    { id: "transfers", label: "Μεταγραφές" },
    { id: "academy",   label: "Ακαδημία" }
  ];

  const CHAT_SEED = {
    match: [
      { user: "Μάκης",  levelId: "ultra",  title: "ever_present", text: "Πάμε γερά!" },
      { user: "Νίκος",  levelId: "hooligan",    title: "stand_voice", text: "Γκολάρα το 10!" },
      { user: "Γιώργος", levelId: "ultra", text: "Τρομερή ασίστ!" },
      { user: "Κώστας", levelId: "ultra",  title: "present", text: "Πάμε για το 3-1!" }
    ],
    transfers: [
      { user: "Σταύρος", levelId: "hooligan",    title: "traveler", text: "Ακούγεται κάτι για τον αριστερό μπακ;" },
      { user: "Δημήτρης", levelId: "casual", text: "Μόνο φήμες μέχρι στιγμής." }
    ],
    academy: [
      { user: "Ελένη",   levelId: "hooligan",   title: "ticket", text: "Μπράβο στα παιδιά του Κ14!" },
      { user: "Παναγιώτης", levelId: "ultra", title: "loyal", text: "Η προπόνηση άλλαξε ώρα;" }
    ]
  };

  const CHAT_AMBIENT = [
    { user: "Θανάσης", levelId: "hooligan",    title: "viewer", text: "Τι φάση με το κόρνερ;" },
    { user: "Βαγγέλης", levelId: "ultra", title: "since_1965", text: "Κερκίδα να ακουστείς!" },
    { user: "Μαρία",   levelId: "casual", text: "Καλή συνέχεια παιδιά 💙" },
    { user: "Σπύρος",  levelId: "ultra", title: "loyal", text: "Από το 1965 εδώ." },
    { user: "Λάκης",   levelId: "touristas", text: "Πρώτη φορά βλέπω live, τέλειο!" },
    { user: "Άννα",    levelId: "hooligan",    title: "voter", text: "Ο τερματοφύλακας τεράστιος." }
  ];

  const POLL = {
    id: "poll_mvp",
    question: "ΨΗΦΟΦΟΡΙΑ: MVP ΑΓΩΝΑ;",
    options: [
      { id: "o1", label: "Νικολάου", votes: 72 },
      { id: "o2", label: "Δήμου",    votes: 28 }
    ]
  };

  /* ---- Βαθμολογίες: πραγματικοί πίνακες με πηγή και ημερομηνία -----------
     Στιγμιότυπο από τις πηγές της κάθε λίγκας. Το κουμπί «Ζωντανή βαθμολογία»
     ανοίγει την τρέχουσα σελίδα. Ενημερώνεται χειροκίνητα. */
  const STANDINGS = {
    "updated": "08/11/2026",
    "leagues": [
      {
        "id": "football",
        "label": "Ποδόσφαιρο",
        "team": "Ανδρών",
        "competition": "Γ΄ Εθνική, 8ος όμιλος",
        "draws": true,
        "rows": [
          {
            "team": "Δόξα Βύρωνα",
            "p": 6,
            "w": 5,
            "d": 1,
            "l": 0,
            "pts": 16
          },
          {
            "team": "Απόλλων Σμύρνης",
            "p": 6,
            "w": 5,
            "d": 0,
            "l": 1,
            "pts": 15
          },
          {
            "team": "Αιγάλεω",
            "p": 6,
            "w": 4,
            "d": 2,
            "l": 0,
            "pts": 14
          },
          {
            "team": "ΑΕΡ Αφάντου",
            "p": 6,
            "w": 3,
            "d": 3,
            "l": 0,
            "pts": 12
          },
          {
            "team": "Διαγόρας",
            "p": 6,
            "w": 3,
            "d": 2,
            "l": 1,
            "pts": 11
          },
          {
            "team": "Εθνικός Πειραιώς",
            "p": 6,
            "w": 2,
            "d": 2,
            "l": 2,
            "pts": 8
          },
          {
            "team": "ΠΑΟ Ρουφ",
            "p": 6,
            "w": 2,
            "d": 1,
            "l": 3,
            "pts": 7
          },
          {
            "team": "Αμφιάλη",
            "p": 6,
            "w": 1,
            "d": 1,
            "l": 4,
            "pts": 4
          },
          {
            "team": "Ιωνικός",
            "p": 6,
            "w": 1,
            "d": 1,
            "l": 4,
            "pts": 4,
            "us": true
          },
          {
            "team": "Προοδευτική",
            "p": 6,
            "w": 1,
            "d": 1,
            "l": 4,
            "pts": 4
          },
          {
            "team": "Απόλλων Καλυθιών",
            "p": 6,
            "w": 1,
            "d": 0,
            "l": 5,
            "pts": 3
          },
          {
            "team": "Ιαλυσός",
            "p": 6,
            "w": 1,
            "d": 0,
            "l": 5,
            "pts": 3
          }
        ],
        "last": {
          "home": "Εθνικός Πειραιώς",
          "away": "Ιωνικός",
          "score": "2-0",
          "date": "01/11/2026"
        },
        "next": {
          "home": "Ιωνικός",
          "away": "Αμφιάλη",
          "date": "08/11/2026",
          "time": "18:00",
          "venue": "Νίκαια"
        },
        "source": {
          "name": "SuperSports",
          "date": "01/11/2026",
          "url": "https://www.supersports.gr/%CF%84%CE%B1-%CF%84%CE%B5%CE%BB%CE%B9%CE%BA%CE%B1-%CF%84%CE%B7%CF%83-%CE%B3-%CE%B5%CE%B8%CE%BD%CE%B9%CE%BA%CE%B7%CF%83-%CE%B2%CE%B1%CE%B8%CE%BC%CE%BF%CE%BB%CE%BF%CE%B3%CE%B9%CE%B5%CF%83-01-11-2026/"
        },
        "liveUrl": "https://www.flashscore.gr/team/ionikos/pxiGlQ4I/",
        "liveName": "Flashscore"
      },
      {
        "id": "basketball",
        "label": "Μπάσκετ",
        "team": "Ανδρών",
        "competition": "National League 1, 1ος όμιλος",
        "draws": false,
        "rows": null,
        "note": "Η ΕΟΚ δεν έχει δημοσιεύσει ακόμη βαθμολογία για τη νέα σεζόν. Δείτε τη ζωντανή σελίδα της ομάδας.",
        "last": {
          "text": "Νίκη με 70-51 απέναντι στον ΑΟ Δάφνης"
        },
        "next": null,
        "source": {
          "name": "Gazzetta (κλήρωση) και Sofascore",
          "date": "08/11/2026",
          "url": "https://www.gazzetta.gr/basketball/2556609/oloklirothike-i-klirosi-ton-ethnikon-protathlimaton-gia-ti-sezon-2026-27"
        },
        "liveUrl": "https://www.sofascore.com/team/basketball/ionikos-nikeas/265712",
        "liveName": "Sofascore"
      },
      {
        "id": "volleyball",
        "label": "Βόλεϊ",
        "team": "Γυναικών",
        "competition": "Α2 Γυναικών, Α΄ Ζώνη",
        "draws": false,
        "rows": [
          {
            "team": "Α.Ο.Ν. Αργυρούπολης Ελληνικού",
            "p": 4,
            "w": 4,
            "d": 0,
            "l": 0,
            "pts": 12
          },
          {
            "team": "Α.Π.Ο. Δάφνη Αγίου Δημητρίου",
            "p": 4,
            "w": 3,
            "d": 0,
            "l": 1,
            "pts": 9
          },
          {
            "team": "Α.Ο. Θρίαμβος Χαϊδαρίου",
            "p": 4,
            "w": 3,
            "d": 0,
            "l": 1,
            "pts": 9
          },
          {
            "team": "Α.Ο. Κελεός",
            "p": 4,
            "w": 3,
            "d": 0,
            "l": 1,
            "pts": 9
          },
          {
            "team": "Γ.Σ. Ηλιούπολης",
            "p": 4,
            "w": 3,
            "d": 0,
            "l": 1,
            "pts": 9
          },
          {
            "team": "ΓΣ Πετρούπολης",
            "p": 4,
            "w": 3,
            "d": 0,
            "l": 1,
            "pts": 8
          },
          {
            "team": "Γ.Ε. Παναχαϊκή",
            "p": 4,
            "w": 2,
            "d": 0,
            "l": 2,
            "pts": 6
          },
          {
            "team": "Ν.Ο.Π. Ρεθύμνου",
            "p": 4,
            "w": 2,
            "d": 0,
            "l": 2,
            "pts": 6
          },
          {
            "team": "Α.Ο. Μελισσιακός",
            "p": 4,
            "w": 1,
            "d": 0,
            "l": 3,
            "pts": 4
          },
          {
            "team": "Α.Ο. Νέοι Βύρωνος",
            "p": 4,
            "w": 0,
            "d": 0,
            "l": 4,
            "pts": 0
          },
          {
            "team": "Μεσσηνιακός Γ.Σ. 1888",
            "p": 4,
            "w": 0,
            "d": 0,
            "l": 4,
            "pts": 0
          },
          {
            "team": "Α.Ο. Ιωνικός Νίκαιας",
            "p": 4,
            "w": 0,
            "d": 0,
            "l": 4,
            "pts": 0,
            "us": true
          }
        ],
        "last": {
          "home": "Α.Π.Ο. Δάφνη",
          "away": "Ιωνικός",
          "score": "Ήττα",
          "date": "07/11/2026"
        },
        "next": {
          "home": "Ιωνικός",
          "away": "Αργυρούπολη Ελληνικού",
          "date": "14/11/2026",
          "time": "18:00",
          "venue": "Νίκαια"
        },
        "source": {
          "name": "Ελληνική Ομοσπονδία Πετοσφαίρισης",
          "date": "μετά την 4η αγωνιστική",
          "url": "https://volleyball.gr/table/a2-gynaikon-a-zoni-2026-2027/"
        },
        "liveUrl": "https://volleyball.gr/table/a2-gynaikon-a-zoni-2026-2027/",
        "liveName": "volleyball.gr"
      }
    ],
    "academies": "Οι ενώσεις δεν δημοσιεύουν online βαθμολογίες για τις ακαδημίες (Κ12 έως Κ16). Θα εμφανίζονται εδώ μόλις τις περνά το γραφείο του συλλόγου."
  };

  /* ---- Εκδηλώσεις  --------------------------------------------- */
  const EVENTS = [
    {
      id: "ev_concert",
      date: "15 ΙΟΥΛΙΟΥ",
      dateText: "15 Ιουλίου",
      venue: "ΓΗΠΕΔΟ ΝΕΑΠΟΛΗΣ",
      title: "Μεγάλη Καλοκαιρινή Συναυλία Συλλόγου",
      time: "21:00",
      gate: "Θύρα VIP Μελών",
      memberPrice: 5.0,
      guestPrice: 15.0,
      cta: "ΚΡΑΤΗΣΗ",
      ctaVariant: "primary",
      tone: "gold",
      requiresLevel: "hooligan"
    },
    {
      id: "ev_camp",
      date: "28 ΙΟΥΝΙΟΥ",
      dateText: "28 Ιουνίου",
      venue: "ΑΚΑΔΗΜΙΕΣ",
      title: "Summer Football Camp & Βραβεύσεις",
      time: "10:00",
      gate: "Θύρα 2",
      memberPrice: 0,
      guestPrice: 10.0,
      cta: "ΔΩΡΕΑΝ QR",
      ctaVariant: "success",
      tone: "ok",
      requiresLevel: null
    }
  ];


  /* ---- Πακέτα συνδρομής: τι περιλαμβάνει το καθένα ---------------------- */
  const PLANS = {
    adult: {
      id: "adult",
      name: "Συνδρομή Μέλους",
      who: "Για ενήλικες φιλάθλους",
      price: 20.0,
      priceNote: "ανά μήνα",
      includes: [
        { title: "Είσοδος στο γήπεδο", text: "Σε όλους τους εντός έδρας αγώνες, με την ψηφιακή κάρτα QR στο κινητό. Ο κωδικός αλλάζει κάθε 60 δευτερόλεπτα." },
        { title: "Ιωνικός TV", text: "Ζωντανή μετάδοση των αγώνων των ακαδημιών σε HD και πλήρες αρχείο με όλους τους αγώνες σε επανάληψη." },
        { title: "Κερκίδα", text: "Live chat κατά τη διάρκεια του αγώνα, δωμάτια για μεταγραφές και ακαδημία, ψηφοφορία για τον MVP." },
        { title: "Εκπτώσεις χορηγών", text: "-15% στα Nikaia Burgers, -20% στο Square Cafe, -10% στην μπουτίκ του συλλόγου, δωρεάν εγγραφή στο Blue Gym." },
        { title: "Τιμή μέλους στις εκδηλώσεις", text: "Για παράδειγμα, η καλοκαιρινή συναυλία κοστίζει 5€ αντί για 15€ και το Summer Camp είναι δωρεάν." },
        { title: "Επίπεδα κερκίδας", text: "Όσο μένετε μέλος ανεβαίνετε επίπεδο: χρώμα στο chat, προτεραιότητα στα εισιτήρια, μετακινήσεις εκτός έδρας, γνωριμία με παίκτες, το όνομά σας στο γήπεδο." },
        { title: "Οικογενειακό προφίλ", text: "Ένας λογαριασμός για όλη την οικογένεια. Ο γονέας ανοίγει την κάρτα του παιδιού από το δικό του κινητό." }
      ]
    },
    academy: {
      id: "academy",
      name: "Συνδρομή Ακαδημίας",
      who: "Για παιδιά που παίζουν στις ακαδημίες",
      price: 10.0,
      priceNote: "ανά μήνα, με έκπτωση 50%",
      includes: [
        { title: "Δική του ψηφιακή κάρτα", text: "Κάρτα QR για είσοδο στους αγώνες. Μπορεί να εμφανιστεί και από το κινητό του γονέα." },
        { title: "Live των αγώνων του τμήματος", text: "Ζωντανή μετάδοση και επανάληψη των αγώνων του παιδιού, μόνο με γονική συναίνεση." },
        { title: "Summer Camp δωρεάν", text: "Δωρεάν συμμετοχή στο Summer Football Camp και στις βραβεύσεις των ακαδημιών." },
        { title: "Έκπτωση 50%", text: "Η έκπτωση ενεργοποιείται μετά από έγκριση του γραφείου του συλλόγου." }
      ]
    }
  };

  /* ---- Χρεώσεις / checkout  ------------------------------------ */
  const BILLING = {
    baseFee: 20.0,
    academyFee: 20.0,
    academyDiscountPct: 50,
    reactivationPerMonth: 5.0,
    downgradeAfterDays: 30,
    currency: "€"
  };

  /* ---- Admin  --------------------------------------------------- */
  const ADMIN = {
    kpis: {
      activeSubscriptions: 412,
      monthlyRevenue: 6840,
      streamCost: 38
    },
    deskPayments: [
      { id: "dp1", member: "Δημήτρης Καρράς", amount: 20.0, receipt: "#Α-492", method: "ΜΕΤΡΗΤΑ" },
      { id: "dp2", member: "Σοφία Βλάχου",    amount: 20.0, receipt: "#Α-493", method: "POS" }
    ],
    academyRequests: [
      { id: "ar1", child: "Κωστής Παπαδόπουλος", squad: "Τμήμα Κ14", parent: "Γιώργος", fee: 10.0 },
      { id: "ar2", child: "Ραφαήλ Μήτσου",       squad: "Τμήμα Κ12", parent: "Ειρήνη",  fee: 10.0 }
    ],
    members: [
      { id: "mb1", name: "Γιώργος Παπαδόπουλος", level: "hooligan",      status: "active",  since: "03/2025", fee: 20 },
      { id: "mb2", name: "Κωστής Παπαδόπουλος",  level: "touristas", status: "active",  since: "06/2025", fee: 10 },
      { id: "mb3", name: "Νίκος Αντωνίου",       level: "hooligan",      status: "grace",   since: "01/2024", fee: 20 },
      { id: "mb4", name: "Δημήτρης Καρράς",      level: "firm",     status: "pending", since: "11/2024", fee: 20 },
      { id: "mb5", name: "Σοφία Βλάχου",         level: "ultra",   status: "active",  since: "02/2023", fee: 20 },
      { id: "mb6", name: "Ελένη Ρίζου",          level: "casual",   status: "active",  since: "08/2026", fee: 20 }
    ],
    matchCosts: [
      { id: "mc1", match: "Κ16 Ιωνικός - Προοδευτική", date: "07/11/2026", viewers: 312, cost: 12 },
      { id: "mc2", match: "Κ14 Ιωνικός - Ατρόμητος",   date: "02/11/2026", viewers: 198, cost: 12 },
      { id: "mc3", match: "Κ12 Ιωνικός - Εθνικός",     date: "26/10/2026", viewers: 141, cost: 14 }
    ]
  };

  /* ---- Κατάσταση σάρωσης στη θύρα  ------------------------------ */
  const SCAN_STATES = {
    valid: {
      key: "valid",
      badge: "OFFLINE READY",
      title: "ΕΓΚΥΡΗ ΚΑΡΤΑ",
      icon: "check",
      action: "Η είσοδος μετράει στα τρόπαια της θύρας",
      tone: "ok"
    },
    duplicate: {
      key: "duplicate",
      badge: "ΠΡΟΣΟΧΗ",
      title: "ΗΔΗ ΣΑΡΩΜΕΝΗ",
      icon: "warn",
      action: "Δεν επιτρέπεται δεύτερη είσοδος",
      tone: "warn"
    },
    rejected: {
      key: "rejected",
      badge: "ΑΠΟΡΡΙΨΗ",
      title: "ΜΗ ΕΓΚΥΡΟ QR",
      icon: "cross",
      action: "Ζητήστε ανανέωση κωδικού στην εφαρμογή",
      tone: "danger"
    },
    expired: {
      key: "expired",
      badge: "ΑΚΥΡΟ",
      title: "ΛΗΓΜΕΝΗ ΣΥΝΔΡΟΜΗ",
      icon: "cross",
      action: "Απαιτείται ανανέωση συνδρομής",
      tone: "danger"
    }
  };

  /* ---- Κάρτες εκτός της οικογένειας, για δοκιμή scanner ------------------- */
  const KNOWN_CARDS = {
    "ION-8472": { name: "Γιώργος Παπαδόπουλος", sub: "Επίπεδο: Hooligan • Ενήλικας", state: "valid" },
    "ION-5513": { name: "Κωστής Παπαδόπουλος", sub: "Ακαδημία Κ14 • Ανήλικος",    state: "valid" },
    "ION-3301": { name: "Νίκος Αντωνίου",      sub: "Σε περίοδο χάριτος (Ημέρα 12)", state: "expired" }
  };

  global.ION_DATA = {
    ACCOUNTS, PROFILES, LEVELS, TIERS, TROPHIES, TROPHY_SEED,
    OFFERS, OFFER_FILTERS,
    LIVE, REACTIONS, FANS, AWAY_TRIP, HISTORY, VOD, CHAT_ROOMS, CHAT_SEED, CHAT_AMBIENT, POLL,
    EVENTS, STANDINGS, PLANS, BILLING, ADMIN, SCAN_STATES, KNOWN_CARDS
  };
})(window);
