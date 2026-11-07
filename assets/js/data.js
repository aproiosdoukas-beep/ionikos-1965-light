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

  /* ---- Παράσημα (badges) -------------------------------------------------- */
  const BADGES = [
    { id: "present",  icon: "🎟️", name: "Παρών",        value: "10/10 Αγώνες", tone: "ok" },
    { id: "customer", icon: "🛍️", name: "Πελάτης",      value: "4/5 Μαγαζιά",  tone: "muted" },
    { id: "voice",    icon: "💬", name: "Φωνή Κερκίδας", value: "Ενεργό",       tone: "ok" },
    { id: "traveler", icon: "🚌", name: "Ταξιδιώτης",   value: "2 Εκτός Έδρας", tone: "muted" }
  ];

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
      { user: "Μάκης",  levelId: "ultra",  text: "Πάμε γερά!" },
      { user: "Νίκος",  levelId: "hooligan",    text: "Γκολάρα το 10!" },
      { user: "Γιώργος", levelId: "ultra", text: "Τρομερή ασίστ!" },
      { user: "Κώστας", levelId: "ultra",  text: "Πάμε για το 3-1!" }
    ],
    transfers: [
      { user: "Σταύρος", levelId: "hooligan",    text: "Ακούγεται κάτι για τον αριστερό μπακ;" },
      { user: "Δημήτρης", levelId: "casual", text: "Μόνο φήμες μέχρι στιγμής." }
    ],
    academy: [
      { user: "Ελένη",   levelId: "hooligan",   text: "Μπράβο στα παιδιά του Κ14!" },
      { user: "Παναγιώτης", levelId: "ultra", text: "Η προπόνηση άλλαξε ώρα;" }
    ]
  };

  const CHAT_AMBIENT = [
    { user: "Θανάσης", levelId: "hooligan",    text: "Τι φάση με το κόρνερ;" },
    { user: "Βαγγέλης", levelId: "ultra", text: "Κερκίδα να ακουστείς!" },
    { user: "Μαρία",   levelId: "casual", text: "Καλή συνέχεια παιδιά 💙" },
    { user: "Σπύρος",  levelId: "ultra", text: "Από το 1965 εδώ." },
    { user: "Λάκης",   levelId: "touristas", text: "Πρώτη φορά βλέπω live, τέλειο!" },
    { user: "Άννα",    levelId: "hooligan",    text: "Ο τερματοφύλακας τεράστιος." }
  ];

  const POLL = {
    id: "poll_mvp",
    question: "ΨΗΦΟΦΟΡΙΑ: MVP ΑΓΩΝΑ;",
    options: [
      { id: "o1", label: "Νικολάου", votes: 72 },
      { id: "o2", label: "Δήμου",    votes: 28 }
    ]
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
      action: "+1 πόντος στο παράσημο «Παρών»",
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
    ACCOUNTS, PROFILES, LEVELS, BADGES,
    OFFERS, OFFER_FILTERS,
    LIVE, VOD, CHAT_ROOMS, CHAT_SEED, CHAT_AMBIENT, POLL,
    EVENTS, PLANS, BILLING, ADMIN, SCAN_STATES, KNOWN_CARDS
  };
})(window);
