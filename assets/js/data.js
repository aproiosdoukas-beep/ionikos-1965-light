/* ==========================================================================
   ΙΩΝΙΚΟΣ 1965 — Demo data (seed)
   Δεν υπάρχει backend. Όλα τα δεδομένα ζουν εδώ και στο localStorage.
   ========================================================================== */
(function (global) {
  "use strict";

  /* ---- Λογαριασμοί επίδειξης -------------------------------------------
     Είναι δημόσια στοιχεία επίδειξης για το mockup — όχι πραγματικοί κωδικοί. */
  const ACCOUNTS = [
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
    p_giorgos: {
      id: "p_giorgos",
      shortName: "Γιώργος",
      fullName: "Γιώργος Παπαδόπουλος",
      kind: "adult",
      kindLabel: "Γονέας",
      cardCode: "ION-8472",
      levelId: "fan",
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
      levelId: "newcomer",
      monthsMember: 5,
      status: "approved",
      statusLabel: "ΕΓΚΕΚΡΙΜΕΝΟ",
      monthlyFee: 10.0,
      discountLabel: "Εγκεκριμένη Έκπτωση Ακαδημίας (−50%)",
      parentConsentStream: true
    }
  };

  /* ---- Τα 5 επίπεδα πιστότητας (Οθόνη 04) -------------------------------- */
  const LEVELS = [
    { id: "newcomer", order: 1, name: "Νεοφερμένος", en: "Newcomer",  range: "0–2 ΜΗΝΕΣ",   minMonths: 0,  perk: "Ψηφιακή Κάρτα & Εκπτώσεις" },
    { id: "friend",   order: 2, name: "Φίλος της Ομάδας", en: "",     range: "3–5 ΜΗΝΕΣ",   minMonths: 3,  perk: "Ξεχωριστό Χρώμα στο Chat" },
    { id: "fan",      order: 3, name: "Οπαδός",      en: "Fan",       range: "6–11 ΜΗΝΕΣ",  minMonths: 6,  perk: "Προτεραιότητα Εισιτηρίων Event" },
    { id: "ultra",    order: 4, name: "Ultra",       en: "",          range: "12–23 ΜΗΝΕΣ", minMonths: 12, perk: "Συναντήσεις με Παίκτες" },
    { id: "legend",   order: 5, name: "Θρύλος",      en: "Legend",    range: "24+ ΜΗΝΕΣ",   minMonths: 24, perk: "Αναγραφή Ονόματος στο Γήπεδο" }
  ];

  /* ---- Παράσημα (badges) -------------------------------------------------- */
  const BADGES = [
    { id: "present",  icon: "🎟️", name: "Παρών",        value: "10/10 Αγώνες", tone: "ok" },
    { id: "customer", icon: "🛍️", name: "Πελάτης",      value: "4/5 Μαγαζιά",  tone: "muted" },
    { id: "voice",    icon: "💬", name: "Φωνή Κερκίδας", value: "Ενεργό",       tone: "ok" },
    { id: "traveler", icon: "🚌", name: "Ταξιδιώτης",   value: "2 Εκτός Έδρας", tone: "muted" }
  ];

  /* ---- Χορηγοί & προσφορές (Οθόνη 03) ------------------------------------ */
  const OFFERS = [
    { id: "m_burgers",  name: "Nikaia Burgers",   category: "food",  icon: "🍔",
      discount: "−15%", headline: "−15% σε όλα τα μενού",
      meta: "Απομένουν 3/4 χρήσεις", usesLeft: 3, usesTotal: 4, featured: true },
    { id: "m_square",   name: "Square Cafe",      category: "food",  icon: "☕",
      discount: "−20%", headline: "−20% Καφές & Σνακ",
      meta: "Καθημερινά 08:00–14:00", usesLeft: 4, usesTotal: 4 },
    { id: "m_boutique", name: "Μπουτίκ Ιωνικού",  category: "shop",  icon: "👕",
      discount: "−10%", headline: "−10% Εμφανίσεις",
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

  /* ---- Live & VOD (Οθόνη 05) --------------------------------------------- */
  const LIVE = {
    id: "match_k16",
    competition: "Πρωτάθλημα Κ16",
    title: "Ιωνικός — Προοδευτική",
    score: "2–1",
    quality: "720p HD",
    clock: "64:18",
    period: "Β′ Ημίχρονο",
    camera: "Κεντρική Κάμερα Γηπέδου",
    watching: 312,
    stand: 184
  };

  const VOD = [
    { id: "vod1", title: "Κ14 Ιωνικός – Ατρόμητος", score: "3–0", date: "02/11/2026", dur: "92'" },
    { id: "vod2", title: "Κ12 Ιωνικός – Εθνικός",   score: "1–1", date: "26/10/2026", dur: "88'" },
    { id: "vod3", title: "Κ16 Ιωνικός – Ηρακλής",   score: "2–2", date: "19/10/2026", dur: "95'" },
    { id: "vod4", title: "Κ14 Ιωνικός – Αίας",      score: "4–1", date: "12/10/2026", dur: "90'" }
  ];

  const CHAT_ROOMS = [
    { id: "match",     label: "Αγώνας" },
    { id: "transfers", label: "Μεταγραφές" },
    { id: "academy",   label: "Ακαδημία" }
  ];

  const CHAT_SEED = {
    match: [
      { user: "Μάκης",  levelId: "ultra",  text: "Πάμε γερά!" },
      { user: "Νίκος",  levelId: "fan",    text: "Γκολάρα το 10!" },
      { user: "Γιώργος", levelId: "legend", text: "Τρομερή ασίστ!" },
      { user: "Κώστας", levelId: "ultra",  text: "Πάμε για το 3–1!" }
    ],
    transfers: [
      { user: "Σταύρος", levelId: "fan",    text: "Ακούγεται κάτι για τον αριστερό μπακ;" },
      { user: "Δημήτρης", levelId: "friend", text: "Μόνο φήμες μέχρι στιγμής." }
    ],
    academy: [
      { user: "Ελένη",   levelId: "fan",   text: "Μπράβο στα παιδιά του Κ14!" },
      { user: "Παναγιώτης", levelId: "ultra", text: "Η προπόνηση άλλαξε ώρα;" }
    ]
  };

  const CHAT_AMBIENT = [
    { user: "Θανάσης", levelId: "fan",    text: "Τι φάση με το κόρνερ;" },
    { user: "Βαγγέλης", levelId: "ultra", text: "Κερκίδα να ακουστείς!" },
    { user: "Μαρία",   levelId: "friend", text: "Καλή συνέχεια παιδιά 💙" },
    { user: "Σπύρος",  levelId: "legend", text: "Από το 1965 εδώ." },
    { user: "Λάκης",   levelId: "newcomer", text: "Πρώτη φορά βλέπω live, τέλειο!" },
    { user: "Άννα",    levelId: "fan",    text: "Ο τερματοφύλακας τεράστιος." }
  ];

  const POLL = {
    id: "poll_mvp",
    question: "ΨΗΦΟΦΟΡΙΑ: MVP ΑΓΩΝΑ;",
    options: [
      { id: "o1", label: "Νικολάου", votes: 72 },
      { id: "o2", label: "Δήμου",    votes: 28 }
    ]
  };

  /* ---- Εκδηλώσεις (Οθόνη 07) --------------------------------------------- */
  const EVENTS = [
    {
      id: "ev_concert",
      date: "15 ΙΟΥΛΙΟΥ",
      venue: "ΓΗΠΕΔΟ ΝΕΑΠΟΛΗΣ",
      title: "Μεγάλη Καλοκαιρινή Συναυλία Συλλόγου",
      time: "21:00",
      gate: "Θύρα VIP Μελών",
      memberPrice: 5.0,
      guestPrice: 15.0,
      cta: "ΚΡΑΤΗΣΗ",
      ctaVariant: "primary",
      tone: "gold",
      requiresLevel: "fan"
    },
    {
      id: "ev_camp",
      date: "28 ΙΟΥΝΙΟΥ",
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

  /* ---- Χρεώσεις / checkout (Οθόνη 06) ------------------------------------ */
  const BILLING = {
    baseFee: 20.0,
    academyFee: 20.0,
    academyDiscountPct: 50,
    reactivationPerMonth: 5.0,
    downgradeAfterDays: 30,
    currency: "€"
  };

  /* ---- Admin (Οθόνη 08) --------------------------------------------------- */
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
      { id: "mb1", name: "Γιώργος Παπαδόπουλος", level: "fan",      status: "active",  since: "03/2025", fee: 20 },
      { id: "mb2", name: "Κωστής Παπαδόπουλος",  level: "newcomer", status: "active",  since: "06/2025", fee: 10 },
      { id: "mb3", name: "Νίκος Αντωνίου",       level: "fan",      status: "grace",   since: "01/2024", fee: 20 },
      { id: "mb4", name: "Δημήτρης Καρράς",      level: "ultra",    status: "pending", since: "11/2024", fee: 20 },
      { id: "mb5", name: "Σοφία Βλάχου",         level: "legend",   status: "active",  since: "02/2023", fee: 20 },
      { id: "mb6", name: "Ελένη Ρίζου",          level: "friend",   status: "active",  since: "08/2026", fee: 20 }
    ],
    matchCosts: [
      { id: "mc1", match: "Κ16 Ιωνικός – Προοδευτική", date: "07/11/2026", viewers: 312, cost: 12 },
      { id: "mc2", match: "Κ14 Ιωνικός – Ατρόμητος",   date: "02/11/2026", viewers: 198, cost: 12 },
      { id: "mc3", match: "Κ12 Ιωνικός – Εθνικός",     date: "26/10/2026", viewers: 141, cost: 14 }
    ]
  };

  /* ---- Κατάσταση σάρωσης στη θύρα (Οθόνη 02) ------------------------------ */
  const SCAN_STATES = {
    valid: {
      key: "valid",
      badge: "OFFLINE READY",
      title: "ΕΓΚΥΡΗ ΚΑΡΤΑ",
      icon: "check",
      action: "+1 Πόντος Badge «Παρών»",
      tone: "ok"
    },
    duplicate: {
      key: "duplicate",
      badge: "ΠΡΟΣΟΧΗ",
      title: "ΗΔΗ ΣΑΡΩΜΕΝΗ",
      icon: "warn",
      action: "Απαγόρευση 2ης Εισόδου",
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
      action: "Απαιτείται Ανανέωση στο Web",
      tone: "danger"
    }
  };

  /* ---- Κάρτες εκτός της οικογένειας, για δοκιμή scanner ------------------- */
  const KNOWN_CARDS = {
    "ION-8472": { name: "Γιώργος Παπαδόπουλος", sub: "Επίπεδο: Οπαδός • Ενήλικας", state: "valid" },
    "ION-5513": { name: "Κωστής Παπαδόπουλος", sub: "Ακαδημία Κ14 • Ανήλικος",    state: "valid" },
    "ION-3301": { name: "Νίκος Αντωνίου",      sub: "Σε περίοδο χάριτος (Ημέρα 12)", state: "expired" }
  };

  global.ION_DATA = {
    ACCOUNTS, PROFILES, LEVELS, BADGES,
    OFFERS, OFFER_FILTERS,
    LIVE, VOD, CHAT_ROOMS, CHAT_SEED, CHAT_AMBIENT, POLL,
    EVENTS, BILLING, ADMIN, SCAN_STATES, KNOWN_CARDS
  };
})(window);
