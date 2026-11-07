/* ==========================================================================
   ΙΩΝΙΚΟΣ 1965 — Core: store, auth, QR tokens, UI helpers
   ========================================================================== */
(function (global) {
  "use strict";

  const D = global.ION_DATA;
  const NS = "ion1965:";

  /* ======================================================================
     STORE — λεπτό στρώμα πάνω από το localStorage
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
      const acc = Auth.account();
      if (!acc || !acc.profiles.length) return null;
      const id = Store.get("activeProfile", acc.profiles[0]);
      return D.PROFILES[id] || D.PROFILES[acc.profiles[0]];
    },

    setActiveProfile(id) {
      Store.set("activeProfile", id);
      return D.PROFILES[id];
    },

    profiles() {
      const acc = Auth.account();
      return acc ? acc.profiles.map(id => D.PROFILES[id]) : [];
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
      newcomer: "var(--ink-300)",
      friend:   "var(--ok-300)",
      fan:      "#5FB2FF",
      ultra:    "#7FD1FF",
      legend:   "var(--ion-gold)"
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
    Store, Auth, Token, QR,
    el, $, $$,
    fmtEuro, mmss, levelById, levelColor, toast, todayKey, hash32
  };
})(window);
