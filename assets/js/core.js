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
  const SEED_PROFILE_IDS = ["p_giorgos", "p_kostis"];

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

    seed() {
      return {
        status: "active",
        cycle: "monthly",
        paymentMethod: "card",
        lastPaidAt: Date.now(),
        cancelledAt: null,
        members: SEED_PROFILE_IDS.map(id => {
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

    get() {
      let m = Store.get("membership", null);
      if (!m || !Array.isArray(m.members) || !m.members.length) {
        m = Membership.save(Membership.seed());
      }
      return m;
    },

    save(m) { Store.set("membership", m); return m; },

    reset() { Store.remove("membership"); return Membership.get(); },

    members() { return Membership.get().members; },

    memberFee: feeOf,

    findByCard(code) {
      return Membership.members().find(m => m.cardCode === code) || null;
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
        cardCode: newCardCode(m.members.map(x => x.cardCode)),
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
    const m = Membership.findByCard(code);
    if (m) {
      const lv = D.LEVELS.find(l => l.id === m.levelId) || D.LEVELS[0];
      const paused = Membership.get().status === "cancelled";
      return {
        name: m.fullName,
        sub: paused
          ? "Συνδρομή σε παύση. Απαιτείται επανενεργοποίηση."
          : (m.kind === "academy" ? m.squad + " • Ανήλικος" : "Επίπεδο: " + lv.name + " • Ενήλικας"),
        state: paused ? "expired" : "valid"
      };
    }
    /* Κάρτα που αφαιρέθηκε από την οικογένεια δεν πρέπει να ανοίγει. */
    const seedIds = ["ION-8472", "ION-5513"];
    if (seedIds.indexOf(code) !== -1) return null;
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

  /** Κλειδί ημέρας, για τον έλεγχο διπλοσάρωσης στη θύρα. */
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  global.ION = {
    Store, Auth, Membership, Token, QR, resolveCard,
    el, $, $$,
    fmtEuro, mmss, levelById, levelColor, toast, todayKey, hash32, upper
  };
})(window);
