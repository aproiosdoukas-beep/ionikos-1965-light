/* ==========================================================================
   ΙΩΝΙΚΟΣ 1965 :: Core: store, auth, QR tokens, UI helpers
   ========================================================================== */
(function (global) {
  "use strict";

  const D = global.ION_DATA;
  const NS = "ion1965:";

  /* ======================================================================
     STORE: λεπτό στρώμα πάνω από το localStorage
     ====================================================================== */
  const Store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(NS + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (_) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(NS + key, JSON.stringify(value)); } catch (_) {}
      return value;
    },
    remove(key) { try { localStorage.removeItem(NS + key); } catch (_) {} },
    clearAll() {
      try {
        Object.keys(localStorage)
          .filter(k => k.indexOf(NS) === 0)
          .forEach(k => localStorage.removeItem(k));
      } catch (_) {}
    }
  };


  /* ======================================================================
     MEMBERSHIP: η συνδρομή είναι επεξεργάσιμη και επιμένει τοπικά.
     Είναι η πηγή αλήθειας για: προφίλ στην εφαρμογή, κάρτες στον scanner,
     και το checkout στο web.
     ====================================================================== */
  /* Κάθε λογαριασμός μέλους έχει τη δική του συνδρομή. Χωρίς συνδεδεμένο
     μέλος (scanner, ταμείο, admin) ο προεπιλεγμένος είναι ο Γιώργος. */
  const DEFAULT_ACCOUNT = "u_giorgos";
  const LEGACY_KEY = "membership";

  function memberAccounts() { return D.ACCOUNTS.filter(a => a.role === "member"); }

  function currentAccountId() {
    const s = Store.get("session", null);
    const acc = s && D.ACCOUNTS.find(a => a.id === s.userId);
    return acc && acc.role === "member" ? acc.id : DEFAULT_ACCOUNT;
  }

  function seedCardCodes() {
    return memberAccounts().reduce((all, a) => all.concat(a.profiles.map(id => D.PROFILES[id].cardCode)), []);
  }

  const CYCLES = {
    monthly: { id: "monthly", label: "Μηνιαία", months: 1,  billed: 1,  note: "Χρέωση κάθε μήνα" },
    yearly:  { id: "yearly",  label: "Ετήσια",  months: 12, billed: 10, note: "2 μήνες δωρεάν" }
  };

  const PAYMENT_METHODS = [
    { id: "card",     label: "Κάρτα",     sub: "Visa •••• 4471" },
    { id: "applepay", label: "Apple Pay", sub: "Άμεση πληρωμή" },
    { id: "viva",     label: "Viva Wallet", sub: "Ελληνικό πορτοφόλι" }
  ];

  const SQUADS = ["Κ10", "Κ12", "Κ14", "Κ16", "Κ18"];

  function feeOf(m) {
    return Math.round(m.baseFee * (1 - (m.discountPct || 0) / 100) * 100) / 100;
  }

  function newCardCode(existing) {
    let code;
    do {
      code = "ION-" + Math.floor(1000 + Math.random() * 9000);
    } while (existing.indexOf(code) !== -1);
    return code;
  }

  const Membership = {
    CYCLES, PAYMENT_METHODS, SQUADS,

    seed(accountId) {
      const acc = D.ACCOUNTS.find(a => a.id === accountId) || D.ACCOUNTS.find(a => a.id === DEFAULT_ACCOUNT);
      return {
        status: "active",
        cycle: "monthly",
        paymentMethod: "card",
        lastPaidAt: Date.now(),
        cancelledAt: null,
        members: acc.profiles.map(id => {
          const p = D.PROFILES[id];
          return {
            id: p.id,
            shortName: p.shortName,
            fullName: p.fullName,
            kind: p.kind,
            kindLabel: p.kindLabel,
            squad: p.squad || null,
            cardCode: p.cardCode,
            levelId: p.levelId,
            monthsMember: p.monthsMember,
            statusLabel: p.statusLabel,
            baseFee: p.kind === "academy" ? D.BILLING.academyFee : D.BILLING.baseFee,
            discountPct: p.kind === "academy" ? D.BILLING.academyDiscountPct : 0,
            parentConsentStream: !!p.parentConsentStream,
            primary: p.kind === "adult",
            removable: p.kind !== "adult"
          };
        })
      };
    },

    get(accountId) {
      const id = accountId || currentAccountId();
      const key = "membership:" + id;
      let m = Store.get(key, null);
      if (!m && id === DEFAULT_ACCOUNT) {
        /* Παλιά αποθήκευση χωρίς λογαριασμό: ανήκε στον Γιώργο. */
        const legacy = Store.get(LEGACY_KEY, null);
        if (legacy) { m = Membership.save(legacy, id); Store.remove(LEGACY_KEY); }
      }
      if (!m || !Array.isArray(m.members) || !m.members.length) {
        m = Membership.save(Membership.seed(id), id);
      }
      return m;
    },

    save(m, accountId) { Store.set("membership:" + (accountId || currentAccountId()), m); return m; },

    reset(accountId) {
      const id = accountId || currentAccountId();
      Store.remove("membership:" + id);
      if (id === DEFAULT_ACCOUNT) Store.remove(LEGACY_KEY);
      return Membership.get(id);
    },

    members(accountId) { return Membership.get(accountId).members; },

    memberFee: feeOf,

    findByCard(code) {
      return Membership.members().find(m => m.cardCode === code) || null;
    },

    /** Βρίσκει ένα προφίλ μέλους σε όποιον λογαριασμό κι αν ανήκει. */
    findProfile(profileId) {
      for (const acc of memberAccounts()) {
        const member = Membership.members(acc.id).find(x => x.id === profileId);
        if (member) return member;
      }
      return null;
    },

    /** Αναζήτηση κάρτας σε όλους τους λογαριασμούς (θύρα, ταμείο). */
    findCardAnywhere(code) {
      for (const acc of memberAccounts()) {
        const m = Membership.get(acc.id);
        const member = m.members.find(x => x.cardCode === code);
        if (member) return { member: member, accountId: acc.id, paused: m.status === "cancelled" };
      }
      return null;
    },

    addMember(input) {
      const m = Membership.get();
      const academy = input.kind === "academy";
      const full = String(input.fullName || "").trim();
      if (!full) return { ok: false, error: "Συμπληρώστε ονοματεπώνυμο." };
      if (m.members.some(x => x.fullName.toLowerCase() === full.toLowerCase())) {
        return { ok: false, error: "Υπάρχει ήδη μέλος με αυτό το όνομα." };
      }
      if (m.members.length >= 6) {
        return { ok: false, error: "Μέγιστο 6 μέλη ανά οικογενειακή συνδρομή." };
      }

      const member = {
        id: "p_" + Date.now().toString(36),
        shortName: full.split(" ")[0],
        fullName: full,
        kind: academy ? "academy" : "adult",
        kindLabel: academy ? (input.squad || "Κ14") : "Ενήλικας",
        squad: academy ? "ΑΚΑΔΗΜΙΑ " + (input.squad || "Κ14") : null,
        cardCode: newCardCode(memberAccounts().reduce((all, a) => all.concat(Membership.members(a.id).map(x => x.cardCode)), seedCardCodes())),
        levelId: "touristas",
        monthsMember: 0,
        statusLabel: academy ? "ΕΓΚΕΚΡΙΜΕΝΟ" : "ΕΝΕΡΓΗ",
        baseFee: academy ? D.BILLING.academyFee : D.BILLING.baseFee,
        discountPct: academy ? D.BILLING.academyDiscountPct : 0,
        parentConsentStream: academy,
        primary: false,
        removable: true
      };

      m.members.push(member);
      Membership.save(m);
      return { ok: true, member: member };
    },

    removeMember(id) {
      const m = Membership.get();
      const target = m.members.find(x => x.id === id);
      if (!target) return { ok: false, error: "Το μέλος δεν βρέθηκε." };
      if (!target.removable) return { ok: false, error: "Ο κύριος κάτοχος δεν αφαιρείται." };
      m.members = m.members.filter(x => x.id !== id);
      Membership.save(m);
      if (Store.get("activeProfile") === id) Store.remove("activeProfile");
      return { ok: true, member: target };
    },

    setCycle(cycle) {
      const m = Membership.get();
      if (CYCLES[cycle]) { m.cycle = cycle; Membership.save(m); }
      return m;
    },

    setPaymentMethod(method) {
      const m = Membership.get();
      if (PAYMENT_METHODS.some(p => p.id === method)) { m.paymentMethod = method; Membership.save(m); }
      return m;
    },

    /** Μήνες κενού από την ακύρωση, ελάχιστο 1 όταν είναι ακυρωμένη. */
    gapMonths() {
      const m = Membership.get();
      if (m.status !== "cancelled" || !m.cancelledAt) return 0;
      const days = (Date.now() - m.cancelledAt) / 86400000;
      return Math.max(1, Math.ceil(days / 30));
    },

    totals() {
      const m = Membership.get();
      const cycle = CYCLES[m.cycle] || CYCLES.monthly;
      const gross = m.members.reduce((s, x) => s + x.baseFee, 0);
      const perMonth = m.members.reduce((s, x) => s + feeOf(x), 0);
      const discount = Math.round((gross - perMonth) * 100) / 100;
      const base = Math.round(perMonth * cycle.billed * 100) / 100;
      const cycleSaving = Math.round(perMonth * (cycle.months - cycle.billed) * 100) / 100;
      const gap = Membership.gapMonths();
      const reactivationFee = gap * D.BILLING.reactivationPerMonth;

      return {
        cycle: cycle,
        gross: gross,
        perMonth: perMonth,
        discount: discount,
        cycleSaving: cycleSaving,
        base: base,
        gapMonths: gap,
        reactivationFee: reactivationFee,
        total: Math.round((base + reactivationFee) * 100) / 100
      };
    },

    cancel() {
      const m = Membership.get();
      m.status = "cancelled";
      m.cancelledAt = Date.now();
      m.members.forEach(x => { x.statusLabel = "ΑΝΕΝΕΡΓΗ"; });
      return Membership.save(m);
    },

    /** Πληρωμή ή επανενεργοποίηση: επαναφέρει την κατάσταση σε ενεργή. */
    pay() {
      const m = Membership.get();
      const wasCancelled = m.status === "cancelled";
      const totals = Membership.totals();

      if (wasCancelled) {
        /* Υποβάθμιση επιπέδου μετά από απουσία > downgradeAfterDays */
        m.members.forEach(x => {
          if (x.kind === "adult" && totals.gapMonths * 30 > D.BILLING.downgradeAfterDays) {
            x.levelId = "casual";
            x.monthsMember = 3;
          }
        });
      }

      m.status = "active";
      m.cancelledAt = null;
      m.lastPaidAt = Date.now();
      m.members.forEach(x => {
        x.statusLabel = x.kind === "academy" ? "ΕΓΚΕΚΡΙΜΕΝΟ" : "ΕΝΕΡΓΗ";
      });
      Membership.save(m);
      return { ok: true, charged: totals.total, reactivated: wasCancelled };
    }
  };

  /* ======================================================================
     ΤΡΟΠΑΙΑ: μετρητές ενεργειών ανά προφίλ, ξεκλείδωμα στο όριο
     ====================================================================== */
  const Trophies = {
    _key(pid) { return "trophies:" + pid; },

    _state(pid) {
      let st = Store.get(Trophies._key(pid), null);
      if (!st) {
        const seed = D.TROPHY_SEED[pid] || { counts: {}, shops: [] };
        st = { counts: Object.assign({}, seed.counts), shops: seed.shops.slice(), unlocked: {}, title: null };
        /* Ό,τι καλύπτουν ήδη οι αρχικοί μετρητές ξεκινά ξεκλείδωτο, χωρίς toast. */
        Trophies._evaluate(pid, st).forEach(id => { st.unlocked[id] = Date.now(); });
        Store.set(Trophies._key(pid), st);
      }
      return st;
    },

    _months(pid) {
      const m = Membership.findProfile(pid) || D.PROFILES[pid];
      return m ? m.monthsMember || 0 : 0;
    },

    _progress(pid, st, t, othersUnlocked) {
      if (t.action === "shops") return st.shops.length;
      if (t.action === "months") return Trophies._months(pid);
      if (t.action === "all") return othersUnlocked;
      return st.counts[t.action] || 0;
    },

    /** Ποια τρόπαια είναι ξεκλείδωτα με την τρέχουσα κατάσταση. */
    _evaluate(pid, st) {
      const open = D.TROPHIES
        .filter(t => t.action !== "all")
        .filter(t => st.unlocked[t.id] || Trophies._progress(pid, st, t, 0) >= t.goal)
        .map(t => t.id);
      D.TROPHIES.filter(t => t.action === "all").forEach(t => {
        if (st.unlocked[t.id] || open.length >= t.goal) open.push(t.id);
      });
      return open;
    },

    /** Καταγράφει μια ενέργεια. Επιστρέφει όσα τρόπαια ξεκλείδωσαν τώρα. */
    record(pid, action, extra) {
      if (!pid) return [];
      const st = Trophies._state(pid);
      const before = Trophies._evaluate(pid, st);
      st.counts[action] = (st.counts[action] || 0) + 1;
      if (action === "redeem" && extra && st.shops.indexOf(extra) === -1) st.shops.push(extra);
      const fresh = Trophies._evaluate(pid, st).filter(id => before.indexOf(id) === -1);
      fresh.forEach(id => { st.unlocked[id] = Date.now(); });
      Store.set(Trophies._key(pid), st);
      return fresh.map(id => D.TROPHIES.find(t => t.id === id));
    },

    forProfile(pid) {
      const st = Trophies._state(pid);
      const open = Trophies._evaluate(pid, st);
      const others = open.filter(id => D.TROPHIES.find(t => t.id === id).action !== "all").length;
      return D.TROPHIES.map(t => {
        const unlocked = open.indexOf(t.id) !== -1;
        return Object.assign({}, t, {
          progress: Math.min(t.goal, Trophies._progress(pid, st, t, others)),
          unlocked: unlocked,
          unlockedAt: unlocked ? st.unlocked[t.id] || null : null
        });
      });
    },

    summary(pid) {
      const s = { bronze: 0, silver: 0, gold: 0, platinum: 0, unlocked: 0, total: D.TROPHIES.length };
      Trophies.forProfile(pid).forEach(t => { if (t.unlocked) { s[t.tier]++; s.unlocked++; } });
      return s;
    },

    setTitle(pid, id) {
      const st = Trophies._state(pid);
      if (id === null) { st.title = null; Store.set(Trophies._key(pid), st); return true; }
      const t = Trophies.forProfile(pid).find(x => x.id === id);
      if (!t || !t.unlocked) return false;
      st.title = id;
      Store.set(Trophies._key(pid), st);
      return true;
    },

    title(pid) {
      const st = Trophies._state(pid);
      return st.title ? D.TROPHIES.find(t => t.id === st.title) || null : null;
    },

    reset() {
      try {
        Object.keys(localStorage)
          .filter(k => k.indexOf(NS + "trophies:") === 0)
          .forEach(k => localStorage.removeItem(k));
      } catch (_) {}
    }
  };

  /* ======================================================================
     ΚΑΤΑΤΑΞΗ ΦΙΛΑΘΛΩΝ: πόντοι από ό,τι έκανε ο φίλαθλος
     ====================================================================== */
  const POINTS = { chat: 1, gate: 5, away: 5, predict_hit: 10, predict_outcome: 3, ticket: 2 };

  const Leaderboard = {
    points(pid) {
      const counts = Trophies._state(pid).counts;
      return Object.keys(POINTS).reduce((sum, k) => sum + (counts[k] || 0) * POINTS[k], 0);
    },

    /** Οι 10 πρώτοι, και η δική σας γραμμή στο τέλος αν είστε εκτός δεκάδας. */
    rows(pid) {
      const p = Membership.findProfile(pid) || D.PROFILES[pid] || {};
      const title = Trophies.title(pid);
      const me = { name: p.fullName || "", levelId: p.levelId || "touristas", title: title ? title.id : null,
                   points: Leaderboard.points(pid), you: true };
      const all = D.FANS.map(f => Object.assign({ you: false }, f)).concat([me])
        .sort((a, b) => b.points - a.points || (a.you ? 1 : 0) - (b.you ? 1 : 0))
        .map((r, i) => Object.assign(r, { rank: i + 1 }));
      const top = all.slice(0, 10);
      return top.some(r => r.you) ? top : top.concat([all.find(r => r.you)]);
    }
  };

  /* ======================================================================
     ΕΚΔΡΟΜΗ: θέση στο λεωφορείο, η πρόοδος τροπαίου μετράει μία φορά
     ====================================================================== */
  const Trips = {
    _key(pid) { return "trip:" + D.AWAY_TRIP.id + ":" + pid; },
    _get(pid) { return Store.get(Trips._key(pid), { joined: false, everJoined: false }); },

    state(pid) {
      const t = D.AWAY_TRIP;
      const joined = Trips._get(pid).joined;
      const taken = Math.min(t.seats, t.taken + (joined ? 1 : 0));
      return { joined: joined, taken: taken, left: t.seats - taken };
    },

    join(pid) {
      const s = Trips._get(pid);
      if (s.joined || Trips.state(pid).left <= 0) return { ok: false, unlocked: [] };
      const first = !s.everJoined;
      Store.set(Trips._key(pid), { joined: true, everJoined: true });
      return { ok: true, unlocked: first ? Trophies.record(pid, "away") : [] };
    },

    reset() {
      try {
        Object.keys(localStorage)
          .filter(k => k.indexOf(NS + "trip:") === 0)
          .forEach(k => localStorage.removeItem(k));
      } catch (_) {}
    },

    cancel(pid) {
      const s = Trips._get(pid);
      if (!s.joined) return false;
      Store.set(Trips._key(pid), { joined: false, everJoined: s.everJoined });
      return true;
    }
  };

  /* ======================================================================
     ΕΠΟΜΕΝΟΣ ΕΝΤΟΣ ΕΔΡΑΣ: αντίστροφη μέτρηση και «Θα είμαι εκεί»
     ====================================================================== */
  /** Ο πλησιέστερος μελλοντικός εντός έδρας αγώνας από τις βαθμολογίες, ή null. */
  function nextHomeGame(nowMs) {
    const list = (D.STANDINGS.leagues || [])
      .filter(l => l.next && l.next.date && l.next.time && String(l.next.home).indexOf("Ιωνικός") === 0)
      .map(l => {
        const [d, m, y] = l.next.date.split("/").map(Number);
        const [hh, mm] = l.next.time.split(":").map(Number);
        return {
          key: l.id + ":" + l.next.date,
          leagueId: l.id, label: l.label, team: l.team,
          opponent: l.next.away, date: l.next.date, time: l.next.time, venue: l.next.venue,
          at: new Date(y, m - 1, d, hh, mm).getTime()
        };
      })
      .filter(g => g.at > nowMs)
      .sort((a, b) => a.at - b.at);
    return list[0] || null;
  }

  /** Μέρες, ώρες, λεπτά που απομένουν. Ποτέ αρνητικά. */
  function countdownParts(ms) {
    const total = Math.max(0, Math.floor(ms / 60000));
    return { days: Math.floor(total / 1440), hours: Math.floor((total % 1440) / 60), minutes: total % 60 };
  }

  const RSVP_BASE = 412;
  const Rsvp = {
    _get(key) { return Store.get("rsvp:" + key, []); },
    count(key) { return RSVP_BASE + Rsvp._get(key).length; },
    mine(key, pid) { return Rsvp._get(key).indexOf(pid) !== -1; },
    toggle(key, pid) {
      const list = Rsvp._get(key);
      const i = list.indexOf(pid);
      if (i === -1) list.push(pid); else list.splice(i, 1);
      Store.set("rsvp:" + key, list);
      return i === -1;
    }
  };

  /* ======================================================================
     ΠΡΟΒΛΕΨΗ ΣΚΟΡ: κλείδωμα μία φορά, κλείσιμο μία φορά
     ====================================================================== */
  const Predictions = {
    _key(pid, matchId) { return "prediction:" + pid + ":" + matchId; },

    get(pid, matchId) { return Store.get(Predictions._key(pid, matchId), null); },

    reset() {
      try {
        Object.keys(localStorage)
          .filter(k => k.indexOf(NS + "prediction:") === 0)
          .forEach(k => localStorage.removeItem(k));
      } catch (_) {}
    },

    lock(pid, matchId, home, away) {
      const ok = n => Number.isInteger(n) && n >= 0 && n <= 9;
      if (!ok(home) || !ok(away) || Predictions.get(pid, matchId)) return false;
      Store.set(Predictions._key(pid, matchId), { home: home, away: away, lockedAt: Date.now(), result: null });
      return true;
    },

    /** Κλείνει την πρόβλεψη με το τελικό σκορ "Χ-Υ". Δεύτερη κλήση δεν ξαναμετράει. */
    settle(pid, matchId, finalScore) {
      const p = Predictions.get(pid, matchId);
      if (!p) return null;
      if (p.result) return { result: p.result, unlocked: [] };
      const [h, a] = String(finalScore).split("-").map(Number);
      const sign = n => (n > 0) - (n < 0);
      const result = p.home === h && p.away === a ? "exact"
        : sign(p.home - p.away) === sign(h - a) ? "outcome" : "miss";
      p.result = result;
      p.final = String(finalScore);
      Store.set(Predictions._key(pid, matchId), p);
      let unlocked = [];
      if (result === "exact") unlocked = Trophies.record(pid, "predict_hit");
      if (result === "outcome") unlocked = Trophies.record(pid, "predict_outcome");
      return { result: result, unlocked: unlocked };
    }
  };

  /* ======================================================================
     LIVE: μετρητής θορύβου κερκίδας και σκορ επίδειξης
     ====================================================================== */
  const clamp100 = n => Math.max(0, Math.min(100, n));
  const Noise = {
    tap(n)   { return clamp100(n + 6); },
    crowd(n) { return clamp100(n + 3); },
    decay(n) { return clamp100(n - 2); },
    label(n) { return n < 34 ? "Ζεσταίνεται" : n < 75 ? "Ακούγεται" : "Σείεται η Νεάπολη"; }
  };

  /** Το σκορ του live, κοινό σε app και web. Το γκολ επίδειξης γίνεται μία φορά. */
  const LiveScore = {
    get() { return Store.get("live:score", D.LIVE.score); },
    scored() { return Store.get("live:score", null) !== null; },
    ended() { return Store.get("live:ended", false) === true; },
    /** Η λήξη του αγώνα (επίδειξη): μετά από αυτήν δεν μπαίνει άλλο γκολ. */
    end() { Store.set("live:ended", true); },
    goal() {
      if (LiveScore.scored() || LiveScore.ended()) return LiveScore.get();
      const parts = D.LIVE.score.split("-").map(Number);
      return Store.set("live:score", (parts[0] + 1) + "-" + parts[1]);
    },
    reset() { Store.remove("live:score"); Store.remove("live:ended"); }
  };

  /* ======================================================================
     AUTH
     ====================================================================== */
  const Auth = {
    login(email, password) {
      const acc = D.ACCOUNTS.find(
        a => a.email.toLowerCase() === String(email).trim().toLowerCase()
      );
      if (!acc) return { ok: false, error: "Δεν βρέθηκε λογαριασμός με αυτό το email." };
      if (acc.password !== password) return { ok: false, error: "Λάθος κωδικός πρόσβασης." };

      Store.set("session", {
        userId: acc.id,
        role: acc.role,
        at: Date.now()
      });
      if (acc.profiles.length && !Store.get("activeProfile")) {
        Store.set("activeProfile", acc.profiles[0]);
      }
      return { ok: true, account: acc };
    },

    logout() {
      Store.remove("session");
      Store.remove("activeProfile");
    },

    session() { return Store.get("session", null); },

    account() {
      const s = Auth.session();
      return s ? D.ACCOUNTS.find(a => a.id === s.userId) || null : null;
    },

    /** Προστατεύει μια σελίδα. roles = array ρόλων που επιτρέπονται. */
    require(roles, redirect) {
      const acc = Auth.account();
      if (!acc || (roles && roles.indexOf(acc.role) === -1)) {
        const to = redirect || "login.html";
        location.replace(to + "?next=" + encodeURIComponent(location.pathname.split("/").pop()));
        return null;
      }
      return acc;
    },

    activeProfile() {
      const list = Auth.profiles();
      if (!list.length) return null;
      const id = Store.get("activeProfile", list[0].id);
      return list.find(p => p.id === id) || list[0];
    },

    setActiveProfile(id) {
      Store.set("activeProfile", id);
      return Auth.activeProfile();
    },

    /** Τα μέλη της συνδρομής, εμπλουτισμένα με το υπολογισμένο κόστος. */
    profiles() {
      const acc = Auth.account();
      if (!acc || !acc.profiles.length) return [];
      return Membership.members().map(m => Object.assign({}, m, {
        monthlyFee: Membership.memberFee(m),
        discountLabel: m.discountPct
          ? "Εγκεκριμένη Έκπτωση Ακαδημίας (-" + m.discountPct + "%)"
          : null
      }));
    }
  };

  /* ======================================================================
     QR TOKEN ENGINE
     Rotating token: αλλάζει κάθε 60s, ευθυγραμμισμένο με το ρολόι,
     ώστε κάρτα και scanner να συμφωνούν χωρίς backend.
     ====================================================================== */
  const TOKEN_TTL = 60;             // δευτερόλεπτα
  const TOKEN_SECRET = "ION-1965-DEMO";
  const TOKEN_PREFIX = "ION1";

  /** Σταθερό, γρήγορο hash (FNV-1a 32-bit) -> 8 hex χαρακτήρες. */
  function hash32(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8).toUpperCase();
  }

  const Token = {
    ttl: TOKEN_TTL,

    windowIndex(at) {
      return Math.floor((at || Date.now()) / 1000 / TOKEN_TTL);
    },

    /** Δευτερόλεπτα μέχρι την επόμενη ανανέωση. */
    secondsLeft(at) {
      const now = Math.floor((at || Date.now()) / 1000);
      return TOKEN_TTL - (now % TOKEN_TTL);
    },

    /** Παράγει το περιεχόμενο του QR για μια κάρτα. */
    build(cardCode, at) {
      const w = Token.windowIndex(at);
      const payload = TOKEN_PREFIX + "|" + cardCode + "|" + w;
      return payload + "|" + hash32(TOKEN_SECRET + "|" + payload);
    },

    /**
     * Επαληθεύει token. Δέχεται το τρέχον και το προηγούμενο παράθυρο
     * (grace 60s), όπως κάνει κάθε TOTP.
     */
    verify(raw, at) {
      const parts = String(raw || "").trim().split("|");
      if (parts.length !== 4 || parts[0] !== TOKEN_PREFIX) {
        return { ok: false, reason: "malformed" };
      }
      const [, cardCode, wStr, sig] = parts;
      const w = parseInt(wStr, 10);
      if (!isFinite(w)) return { ok: false, reason: "malformed" };

      const expected = hash32(TOKEN_SECRET + "|" + TOKEN_PREFIX + "|" + cardCode + "|" + w);
      if (expected !== sig) return { ok: false, reason: "signature", cardCode };

      const current = Token.windowIndex(at);
      const age = current - w;
      if (age < 0) return { ok: false, reason: "future", cardCode };
      if (age > 1) return { ok: false, reason: "stale", cardCode, ageSeconds: age * TOKEN_TTL };

      return { ok: true, cardCode, window: w, ageSeconds: age * TOKEN_TTL };
    }
  };

  /* ======================================================================
     QR RENDERER (vendor: qrcode-generator, MIT)
     ====================================================================== */
  const QR = {
    /**
     * Σχεδιάζει QR σε <canvas> μέσα στο δοσμένο container.
     * @param {HTMLElement} el container
     * @param {string} text περιεχόμενο
     * @param {object} opts { size, dark, light, quiet }
     */
    render(el, text, opts) {
      if (!el) return;
      const o = Object.assign({ size: 180, dark: "#0F172A", light: "#FFFFFF", quiet: 2 }, opts);

      const qr = global.qrcode(0, "M");        // version auto, ECC medium
      qr.addData(text);
      qr.make();

      const count = qr.getModuleCount();
      const total = count + o.quiet * 2;
      const dpr = Math.min(global.devicePixelRatio || 1, 3);
      const cell = Math.max(1, Math.floor((o.size * dpr) / total));
      const px = cell * total;

      let canvas = el.querySelector("canvas");
      if (!canvas) {
        canvas = document.createElement("canvas");
        el.appendChild(canvas);
      }
      canvas.width = px;
      canvas.height = px;
      canvas.style.width = o.size + "px";
      canvas.style.height = o.size + "px";

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = o.light;
      ctx.fillRect(0, 0, px, px);
      ctx.fillStyle = o.dark;
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect((c + o.quiet) * cell, (r + o.quiet) * cell, cell, cell);
          }
        }
      }
      el.setAttribute("data-token", text);
      return canvas;
    },

    /**
     * Ζωντανό QR που ανανεώνεται κάθε 60s, με countdown.
     * @returns {{stop:Function, refresh:Function}}
     */
    live(el, cardCode, opts) {
      const o = opts || {};
      const onTick = o.onTick || function () {};
      let currentWindow = -1;
      let timer = null;

      function paint(force) {
        const w = Token.windowIndex();
        if (force || w !== currentWindow) {
          currentWindow = w;
          QR.render(el, Token.build(cardCode), o);
          if (o.onRotate) o.onRotate(Token.build(cardCode));
        }
        onTick(Token.secondsLeft(), Token.ttl);
      }

      paint(true);
      timer = setInterval(paint, 250);

      return {
        stop() { clearInterval(timer); },
        refresh() { paint(true); }
      };
    }
  };


  /**
   * Βρίσκει ποιος κρατά μια κάρτα. Τα μέλη της συνδρομής έχουν προτεραιότητα,
   * ώστε προσθήκες, αφαιρέσεις και παύση στο web να ισχύουν στη θύρα.
   * @returns {{name, sub, state}|null}
   */
  function resolveCard(code) {
    const found = Membership.findCardAnywhere(code);
    if (found) {
      const m = found.member;
      const lv = D.LEVELS.find(l => l.id === m.levelId) || D.LEVELS[0];
      const paused = found.paused;
      return {
        profileId: m.id,
        name: m.fullName,
        sub: paused
          ? "Συνδρομή σε παύση. Απαιτείται επανενεργοποίηση."
          : (m.kind === "academy" ? m.squad + " • Ανήλικος" : "Επίπεδο: " + lv.name + " • Ενήλικας"),
        state: paused ? "expired" : "valid"
      };
    }
    /* Κάρτα που αφαιρέθηκε από την οικογένεια δεν πρέπει να ανοίγει. */
    if (seedCardCodes().indexOf(code) !== -1) return null;
    return D.KNOWN_CARDS[code] || null;
  }

  /* ======================================================================
     UI HELPERS
     ====================================================================== */
  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(k => {
        const v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") n.className = v;
        else if (k === "html") n.innerHTML = v;
        else if (k === "text") n.textContent = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") {
          n.addEventListener(k.slice(2).toLowerCase(), v);
        } else n.setAttribute(k, v);
      });
    }
    (Array.isArray(children) ? children : children != null ? [children] : [])
      .forEach(c => {
        if (c == null) return;
        n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    return n;
  }


  /**
   * Ελληνικά κεφαλαία: στα κεφαλαία ο τόνος παραλείπεται, τα διαλυτικά μένουν.
   * Το String.toUpperCase() τον κρατά ("ΜΉΝΑΣ"), κάτι που είναι λάθος.
   */
  function upper(str) {
    return String(str).normalize("NFD").replace(/\u0301/g, "").toUpperCase().normalize("NFC");
  }

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  function fmtEuro(n) {
    return new Intl.NumberFormat("el-GR", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(n) + "€";
  }

  function mmss(sec) {
    const s = Math.max(0, Math.floor(sec));
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }

  function levelById(id) { return D.LEVELS.find(l => l.id === id) || D.LEVELS[0]; }

  /** Χρώμα ονόματος στο chat ανά επίπεδο (perk του «Φίλος της Ομάδας»). */
  function levelColor(id) {
    return ({
      touristas: "var(--ink-300)",
      casual:    "var(--ok-300)",
      hooligan:  "#5FB2FF",
      firm:      "#7FD1FF",
      ranger:    "var(--ion-gold-300)",
      ultra:     "var(--ion-gold)"
    })[id] || "var(--ink-300)";
  }

  let toastHost = null;
  function toast(message, tone, ms) {
    if (!toastHost) {
      toastHost = el("div", { class: "toast-host", role: "status", "aria-live": "polite" });
      document.body.appendChild(toastHost);
    }
    const t = el("div", { class: "toast" + (tone ? " toast--" + tone : ""), text: message });
    toastHost.appendChild(t);
    setTimeout(() => t.remove(), ms || 2800);
  }

  /** Ο τίτλος (τρόπαιο) ενός μηνύματος: από το id του, ή από την επιλογή του προφίλ. */
  function chatTitle(m) {
    if (m.title) return D.TROPHIES.find(t => t.id === m.title) || null;
    if (m.profileId) return Trophies.title(m.profileId);
    return null;
  }

  /** Μία γραμμή chat, ίδια σε app και web. Το κείμενο μπαίνει πάντα ως text. */
  function chatLine(m) {
    const lv = levelById(m.levelId);
    const t = chatTitle(m);
    return el("div", { class: "chat__msg" + (m.own ? " chat__msg--own" : "") }, [
      el("div", { class: "chat__head" }, [
        el("span", { class: "chat__user", style: "color:" + levelColor(m.levelId), text: m.user }),
        el("span", { class: "chat__level", text: lv.en || lv.name }),
        t ? el("span", { class: "chat__title trophy-tier--" + t.tier, title: D.TIERS[t.tier].label }, [
          el("span", { class: "tier-dot" }),
          document.createTextNode(t.name)
        ]) : null
      ]),
      el("div", { class: "chat__text", text: m.text })
    ]);
  }

  /** Πίνακας βαθμολογίας, ίδιος σε web και app. compact: οι 4 πρώτοι και ο Ιωνικός. */
  function standingsTable(sport, t, compact) {
    const us = r => !!r.us;
    const rows = compact ? t.rows.filter((r, i) => i < 4 || us(r)) : t.rows;
    const th = (txt, cls, title) => el("th", { class: cls || null, text: txt, title: title || null });
    const td = (txt, cls) => el("td", { class: cls || null, text: String(txt) });
    return el("table", { class: "table standings" }, [
      el("thead", {}, [el("tr", {}, [
        th("#"), th("Ομάδα"), th("Α", "num", "Αγώνες"), th("Ν", "num col-wdl", "Νίκες"),
        sport.draws ? th("Ι", "num col-wdl", "Ισοπαλίες") : null,
        th("Η", "num col-wdl", "Ήττες"), th("Β", "num", "Βαθμοί")
      ])]),
      el("tbody", {}, rows.map(r => el("tr", { class: us(r) ? "is-us" : null }, [
        td(t.rows.indexOf(r) + 1, "pos"), td(r.team, "team"), td(r.p, "num"), td(r.w, "num col-wdl"),
        sport.draws ? td(r.d, "num col-wdl") : null, td(r.l, "num col-wdl"), td(r.pts, "num pts")
      ])))
    ]);
  }

  /**
   * Αντιδράσεις, μετρητής θορύβου και γκολ επίδειξης για έναν player.
   * onScore(score, fresh) καλείται όταν αλλάξει το σκορ (fresh: το γκολ έγινε τώρα εδώ).
   * Επιστρέφει { el, stop, goal }.
   */
  function liveHype(player, onScore) {
    let level = 20;
    const timers = [];
    const bar = el("span", { style: "width:20%" });
    const track = el("div", { class: "noise__bar", role: "meter", "aria-valuemin": "0", "aria-valuemax": "100", "aria-label": "Θόρυβος κερκίδας" }, [bar]);
    const label = el("span", { class: "noise__label", text: Noise.label(level) });
    const meter = el("div", { class: "noise" }, [
      el("div", { class: "noise__head" }, [el("span", { class: "noise__title", text: "Θόρυβος κερκίδας" }), label]),
      track
    ]);
    function paint() {
      bar.style.width = level + "%";
      track.setAttribute("aria-valuenow", String(level));
      label.textContent = Noise.label(level);
      meter.classList.toggle("is-loud", level >= 75);
    }
    function float(emoji) {
      const f = el("span", { class: "float-emoji", "aria-hidden": "true", text: emoji,
        style: "left:" + (15 + Math.random() * 70).toFixed(0) + "%" });
      f.addEventListener("animationend", () => f.remove());
      player.appendChild(f);
      setTimeout(() => f.remove(), 2500);
    }
    const row = el("div", { class: "reactions" }, D.REACTIONS.map(r => el("button", {
      class: "reaction", type: "button", "aria-label": r.label, title: r.label, text: r.emoji,
      onclick() { level = Noise.tap(level); float(r.emoji); paint(); }
    })));
    function goal() {
      /* Το γκολ έγινε ήδη (σε άλλη καρτέλα ή σελίδα) ή ο αγώνας έληξε: μόνο συγχρονισμός σκορ. */
      if (LiveScore.scored() || LiveScore.ended()) {
        if (onScore) onScore(LiveScore.get());
        return LiveScore.get();
      }
      const score = LiveScore.goal();
      level = 100; paint();
      const banner = el("div", { class: "goal-banner", role: "status", text: upper("Γκολ του Ιωνικού") });
      player.appendChild(banner);
      setTimeout(() => banner.remove(), 3000);
      for (let i = 0; i < 6; i++) setTimeout(() => float(i % 2 ? "💙" : "⚽"), i * 120);
      if (onScore) onScore(score, true);
      return score;
    }
    timers.push(setInterval(() => {
      level = Noise.crowd(level);
      if (Math.random() < .3) float(D.REACTIONS[Math.floor(Math.random() * D.REACTIONS.length)].emoji);
      paint();
    }, 800));
    timers.push(setInterval(() => { level = Noise.decay(level); paint(); }, 400));
    if (!LiveScore.scored() && !LiveScore.ended()) timers.push(setTimeout(goal, 45000));
    /* Άλλη καρτέλα έβαλε το γκολ: ενημέρωση σκορ χωρίς επανάληψη της στιγμής. */
    function onStorage(e) { if (e.key === NS + "live:score" && onScore) onScore(LiveScore.get()); }
    if (global.addEventListener) global.addEventListener("storage", onStorage);
    paint();
    return {
      el: el("div", { class: "hype" }, [row, meter]),
      goal: goal,
      stop() {
        timers.forEach(t => { clearInterval(t); clearTimeout(t); });
        if (global.removeEventListener) global.removeEventListener("storage", onStorage);
      }
    };
  }

  /** Κάρτα πρόβλεψης σκορ για τον αγώνα του live. rerender() ξαναχτίζει την κάρτα. */
  function predictionCard(pid, onSettle) {
    const L = D.LIVE;
    const teams = L.title.split(" vs ");
    const wrap = el("div", { class: "predict" });
    const icon = global.icon;

    function draw() {
      wrap.innerHTML = "";
      wrap.className = "predict";
      const p = pid ? Predictions.get(pid, L.id) : null;
      wrap.appendChild(el("div", { class: "between" }, [
        el("span", { class: "predict__title", text: "Πρόβλεψη σκορ" }),
        el("span", { class: "t-xs", style: "color:var(--ink-300)", text: L.competition })
      ]));

      if (!pid) {
        wrap.appendChild(el("p", { class: "t-sm", style: "margin:0;color:var(--ink-300)", text: "Συνδεθείτε για να κάνετε πρόβλεψη." }));
        return;
      }

      if (!p) {
        const pick = [0, 0];
        const val = [el("b", { class: "stepper__value", text: "0" }), el("b", { class: "stepper__value", text: "0" })];
        const stepper = i => el("div", { class: "stepper" }, [
          el("span", { class: "stepper__team", text: teams[i] }),
          el("div", { class: "stepper__ctrl" }, [
            el("button", { class: "btn btn--ghost btn--icon btn--sm", type: "button", "aria-label": "Ένα γκολ λιγότερο για " + teams[i],
              html: icon("minus", 16, 2.2), onclick() { pick[i] = Math.max(0, pick[i] - 1); val[i].textContent = pick[i]; } }),
            val[i],
            el("button", { class: "btn btn--ghost btn--icon btn--sm", type: "button", "aria-label": "Ένα γκολ περισσότερο για " + teams[i],
              html: icon("plus", 16, 2.2), onclick() { pick[i] = Math.min(9, pick[i] + 1); val[i].textContent = pick[i]; } })
          ])
        ]);
        wrap.append(
          el("div", { class: "predict__pick" }, [stepper(0), stepper(1)]),
          el("button", { class: "btn btn--gold btn--block", type: "button", text: "Κλείδωμα πρόβλεψης",
            onclick() { if (Predictions.lock(pid, L.id, pick[0], pick[1])) { toast("Κλειδώσατε " + pick[0] + "-" + pick[1], "ok"); draw(); } } })
        );
        return;
      }

      /* Μετά το κλείδωμα η κάρτα γίνεται μία λεπτή γραμμή, για να φαίνεται το chat. */
      wrap.innerHTML = "";
      wrap.className = "predict predict--slim";
      if (!p.result) {
        wrap.append(
          el("span", { class: "predict__label", text: "Η πρόβλεψή σας" }),
          el("b", { class: "predict__score", text: p.home + "-" + p.away }),
          el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Λήξη αγώνα (επίδειξη)",
            onclick() {
              const r = Predictions.settle(pid, L.id, LiveScore.get());
              if (!r) { draw(); return; }
              LiveScore.end();
              celebrate(r.unlocked);
              draw();
              if (onSettle) onSettle(r);
            } })
        );
        return;
      }

      const msg = { exact: "Ακριβές σκορ, +10 πόντοι", outcome: "Σωστό σημείο, +3 πόντοι", miss: "Δεν βγήκε αυτή τη φορά" }[p.result];
      wrap.append(
        el("span", { class: "predict__label", text: "Τελικό " + (p.final || LiveScore.get()) + ", πρόβλεψη " + p.home + "-" + p.away }),
        el("b", { class: "predict__verdict is-" + p.result, text: msg })
      );
    }
    draw();
    return wrap;
  }

  /** Επιλογή μηνυμάτων κερκίδας: κάθε μήνυμα βγαίνει μία φορά ανά γύρο,
   *  και ο ίδιος φίλαθλος δεν γράφει δύο φορές στη σειρά. */
  function ambientPicker(list) {
    let bag = [];
    let last = null;
    const userAt = (arr, i) => (i >= 0 && i < arr.length ? arr[i].user : null);
    function refill() {
      bag = list.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
      }
      for (let i = 0; i < bag.length; i++) {
        const prev = i === 0 ? (last && last.user) : bag[i - 1].user;
        if (bag[i].user !== prev) continue;
        let k = -1;
        for (let j = i + 1; j < bag.length && k < 0; j++) if (bag[j].user !== prev) k = j;
        for (let j = 0; j < i - 1 && k < 0; j++) {
          const fitsHere = bag[j].user !== prev && bag[j].user !== userAt(bag, i + 1);
          const fitsThere = bag[i].user !== userAt(bag, j - 1) && bag[i].user !== userAt(bag, j + 1);
          if (fitsHere && fitsThere && !(j === 0 && last && bag[i].user === last.user)) k = j;
        }
        if (k >= 0) { const t = bag[i]; bag[i] = bag[k]; bag[k] = t; }
      }
    }
    return function next() {
      if (!bag.length) refill();
      last = bag.shift();
      return last;
    };
  }

  /** Πίνακας κατάταξης φιλάθλων. limit: πόσες γραμμές πριν από τη δική σας. */
  function leaderboardTable(pid, limit) {
    let rows = Leaderboard.rows(pid);
    if (limit) {
      const mine = rows.find(r => r.you);
      rows = rows.slice(0, limit);
      if (!rows.some(r => r.you)) rows.push(mine);
    }
    return el("table", { class: "table leaderboard" }, [
      el("thead", {}, [el("tr", {}, [
        el("th", { text: "#" }), el("th", { text: "Φίλαθλος" }), el("th", { class: "num", text: "Πόντοι" })
      ])]),
      el("tbody", {}, rows.map(r => {
        const t = r.title ? D.TROPHIES.find(x => x.id === r.title) : null;
        return el("tr", { class: r.you ? "is-you" : null }, [
          el("td", { class: "pos", text: String(r.rank) }),
          el("td", {}, [
            el("div", { class: "leaderboard__name", style: "color:" + levelColor(r.levelId), text: r.you ? r.name + " (εσείς)" : r.name }),
            t ? el("span", { class: "chat__title trophy-tier--" + t.tier }, [el("span", { class: "tier-dot" }), document.createTextNode(t.name)]) : null
          ]),
          el("td", { class: "num pts", text: String(r.points) })
        ]);
      }))
    ]);
  }

  /** Κάρτα «Πάμε εκτός έδρας» με λεωφορείο 50 θέσεων. */
  function tripCard(pid) {
    const t = D.AWAY_TRIP;
    const wrap = el("div", { class: "card trip" });
    function draw() {
      wrap.innerHTML = "";
      const s = pid ? Trips.state(pid) : Trips.state("_guest");
      const seats = [];
      for (let i = 0; i < t.seats; i++) {
        const mine = s.joined && i === s.taken - 1;
        seats.push(el("span", { class: "bus__seat" + (i < s.taken ? " is-taken" : "") + (mine ? " is-mine" : "") }));
      }
      const action = !pid
        ? el("a", { class: "btn btn--primary btn--block", href: "login.html?next=web.html", text: "Συνδεθείτε για να κλείσετε θέση" })
        : s.joined
          ? el("button", { class: "btn btn--ghost btn--block", type: "button", text: "Ακύρωση θέσης",
              onclick() { Trips.cancel(pid); toast("Η θέση σας ακυρώθηκε", null); draw(); } })
          : el("button", { class: "btn btn--gold btn--block", type: "button", disabled: s.left <= 0,
              text: s.left <= 0 ? "Το λεωφορείο γέμισε" : "Κλείνω θέση",
              onclick() {
                const r = Trips.join(pid);
                if (!r.ok) return;
                toast("Κλείσατε θέση για " + t.match, "ok");
                celebrate(r.unlocked);
                draw();
              } });
      wrap.append(
        el("div", { class: "between", style: "flex-wrap:wrap" }, [
          el("div", { class: "eyebrow", text: "Πάμε εκτός έδρας" }),
          el("span", { class: "badge", text: "Δεδομένα επίδειξης" })
        ]),
        el("div", { class: "trip__match", text: t.match }),
        el("div", { class: "t-sm muted", text: t.destination }),
        el("div", { class: "trip__meta" }, [
          el("span", {}, [el("b", { text: t.date }), document.createTextNode(", αναχώρηση " + t.time)]),
          el("span", { text: "Συνάντηση: " + t.meet }),
          el("span", { text: "Τιμή μέλους: " + fmtEuro(t.price) })
        ]),
        el("div", { class: "bus", "aria-label": "Λεωφορείο: " + s.taken + " από " + t.seats + " θέσεις πιασμένες" }, [
          el("div", { class: "bus__front", text: t.title }),
          el("div", { class: "bus__seats" }, seats)
        ]),
        el("div", { class: "trip__left" + (s.left <= 5 ? " is-low" : ""),
                    text: s.left === 0 ? "Το λεωφορείο γέμισε" : s.left === 1 ? "Έχει μείνει 1 θέση" : "Έχουν μείνει " + s.left + " θέσεις" }),
        action
      );
    }
    draw();
    return wrap;
  }

  /** Κάρτα «Επόμενος εντός έδρας» με αντίστροφη μέτρηση και «Θα είμαι εκεί». */
  function countdownCard(pid, loginHref) {
    const g = nextHomeGame(Date.now());
    const wrap = el("div", { class: "card card--navy theme-dark countdown" });
    if (!g) {
      wrap.append(
        el("div", { class: "eyebrow", text: "Επόμενος εντός έδρας" }),
        el("p", { class: "t-sm", style: "margin:0", text: "Το πρόγραμμα ανακοινώνεται σύντομα." })
      );
      return wrap;
    }
    const boxes = { days: el("b"), hours: el("b"), minutes: el("b") };
    const unit = (k, label) => el("div", { class: "countdown__unit" }, [boxes[k], el("span", { text: label })]);
    const count = el("span", { class: "countdown__count" });
    const btnBox = el("div");
    let timer = null;

    function tick() {
      if (!wrap.isConnected && timer) { clearInterval(timer); return; }
      const p = countdownParts(g.at - Date.now());
      boxes.days.textContent = p.days;
      boxes.hours.textContent = String(p.hours).padStart(2, "0");
      boxes.minutes.textContent = String(p.minutes).padStart(2, "0");
    }
    function drawRsvp() {
      btnBox.innerHTML = "";
      const n = Rsvp.count(g.key);
      count.textContent = "Έρχονται " + n.toLocaleString("el-GR") + " φίλαθλοι (αριθμός επίδειξης)";
      if (!pid) {
        btnBox.appendChild(el("a", { class: "btn btn--gold btn--block", href: loginHref || "login.html", text: "Θα είμαι εκεί" }));
        return;
      }
      const going = Rsvp.mine(g.key, pid);
      btnBox.appendChild(el("button", {
        class: "btn btn--block " + (going ? "btn--success" : "btn--gold"), type: "button",
        "aria-pressed": String(going),
        text: going ? "Θα είμαι εκεί ✓" : "Θα είμαι εκεί",
        onclick() {
          const now = Rsvp.toggle(g.key, pid);
          toast(now ? "Σας περιμένουμε στη Νεάπολη" : "Η δήλωσή σας αφαιρέθηκε", now ? "ok" : null);
          drawRsvp();
        }
      }));
    }

    wrap.append(
      el("div", { class: "between", style: "flex-wrap:wrap" }, [
        el("div", { class: "eyebrow", text: "Επόμενος εντός έδρας" }),
        el("span", { class: "t-xs", style: "color:var(--ink-300)", text: g.label + " " + g.team.toLowerCase() })
      ]),
      el("div", { class: "countdown__match", text: "Ιωνικός - " + g.opponent }),
      el("div", { class: "t-sm", style: "color:var(--ink-300)", text: g.date + ", " + g.time + (g.venue ? ", " + g.venue : "") }),
      el("div", { class: "countdown__units", role: "timer", "aria-label": "Χρόνος μέχρι τη σέντρα" },
        [unit("days", "μέρες"), unit("hours", "ώρες"), unit("minutes", "λεπτά")]),
      count,
      btnBox
    );
    tick();
    drawRsvp();
    timer = setInterval(tick, 30000);
    return wrap;
  }

  /** Ένα toast για κάθε τρόπαιο που μόλις ξεκλείδωσε. */
  function celebrate(list) {
    (list || []).forEach(t => {
      if (!t) return;
      toast("Νέο τρόπαιο: " + t.name, "trophy trophy-tier--" + t.tier, 4000);
    });
    return (list || []).length;
  }

  /** Κλειδί ημέρας, για τον έλεγχο διπλοσάρωσης στη θύρα. */
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  global.ION = {
    Store, Auth, Membership, Trophies, Predictions, Leaderboard, Trips, Rsvp, nextHomeGame, countdownParts, Noise, LiveScore, Token, QR, resolveCard,
    el, $, $$,
    fmtEuro, mmss, levelById, levelColor, toast, celebrate, chatTitle, chatLine, ambientPicker, standingsTable, liveHype, predictionCard, leaderboardTable, tripCard, countdownCard, todayKey, hash32, upper
  };
})(window);
