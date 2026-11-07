/* ==========================================================================
   ΙΩΝΙΚΟΣ 1965 :: Εφαρμογή ελέγχου θύρας
   Πραγματική επαλήθευση υπογεγραμμένου, χρονικά περιορισμένου token.
   ========================================================================== */
(function () {
  "use strict";

  const D = window.ION_DATA;
  const { Store, Token, el, $, $$, toast, todayKey, hash32, resolveCard } = window.ION;

  $("#sbIcons").innerHTML = icon("signal", 15, 1.6) + icon("wifi", 15, 1.6) + icon("battery", 20, 1.5);

  const view = $("#scanView");
  const LOG_KEY = "gate:log:" + todayKey();

  function log()        { return Store.get(LOG_KEY, {}); }
  function saveLog(l)   { Store.set(LOG_KEY, l); updateCount(); }
  function updateCount(){ $("#scanCount").textContent = Object.keys(log()).length; }

  /* ---- Αρχική κατάσταση -------------------------------------------------- */
  function renderIdle() {
    view.innerHTML = "";
    view.appendChild(
      el("div", { class: "scan-state scan-state--idle" }, [
        el("div", { class: "scan-state__top" }, [
          el("span", { text: "SCANNER ΘΥΡΑΣ 1" }),
          el("span", { class: "gold", text: "ΑΝΑΜΟΝΗ" })
        ]),
        el("div", { class: "scan-state__glyph scan-state__glyph--idle", html: icon("camera", 44, 1.5) }),
        el("div", {}, [
          el("div", { class: "scan-state__title", text: "ΣΑΡΩΣΤΕ ΚΑΡΤΑ" }),
          el("div", { class: "scan-state__sub", style: "margin-top:8px", text: "Στρέψτε την κάμερα στο QR του μέλους" })
        ]),
        el("div", { class: "scan-state__action", text: "Λειτουργία Offline, συγχρονισμός αργότερα" })
      ])
    );
  }

  /* ---- Αποτέλεσμα σάρωσης ------------------------------------------------ */
  function renderResult(res) {
    const S = D.SCAN_STATES[res.state];
    const toneClass = { ok: "ok", warn: "warn", danger: "danger" }[S.tone];

    view.innerHTML = "";
    view.appendChild(
      el("div", { class: "scan-state scan-state--" + toneClass }, [
        el("div", { class: "scan-state__top" }, [
          el("span", { text: "SCANNER ΘΥΡΑΣ 1" }),
          el("span", { text: S.badge })
        ]),
        el("div", {
          class: "scan-state__glyph scan-state__glyph--" + toneClass,
          html: icon(S.icon, 48, 2.6)
        }),
        el("div", {}, [
          el("div", { class: "scan-state__title", text: S.title }),
          el("div", { class: "scan-state__name", style: "margin-top:12px", text: res.name }),
          el("div", { class: "scan-state__sub", style: "margin-top:4px", text: res.sub })
        ]),
        el("div", { class: "scan-state__action", text: S.action })
      ])
    );

    setTimeout(renderIdle, 6000);
  }

  /* ---- Η λογική επαλήθευσης ---------------------------------------------- */
  function processToken(raw) {
    const check = Token.verify(raw);

    if (!check.ok) {
      const messages = {
        malformed: "Μη αναγνώσιμος κωδικός QR",
        signature: "Πλαστό ή αλλοιωμένο QR",
        stale:     "Ο κωδικός έληξε (άνω των 60 δευτ.)",
        future:    "Μη έγκυρη χρονοσήμανση"
      };
      renderResult({
        state: "rejected",
        name: check.cardCode || "Άγνωστη κάρτα",
        sub: messages[check.reason] || "Απορρίφθηκε"
      });
      toast(messages[check.reason] || "Απορρίφθηκε", "danger");
      return;
    }

    const card = resolveCard(check.cardCode);
    if (!card) {
      renderResult({ state: "rejected", name: check.cardCode, sub: "Η κάρτα δεν βρέθηκε στο μητρώο" });
      return;
    }

    /* Ληγμένη συνδρομή */
    if (card.state === "expired") {
      renderResult({ state: "expired", name: card.name, sub: card.sub });
      return;
    }

    /* Διπλή σάρωση την ίδια ημέρα */
    const entries = log();
    if (entries[check.cardCode]) {
      renderResult({
        state: "duplicate",
        name: card.name,
        sub: "Πρώτη είσοδος: " + entries[check.cardCode] + " (Θύρα 1)"
      });
      return;
    }

    /* Έγκυρη */
    const now = new Date();
    entries[check.cardCode] =
      String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    saveLog(entries);

    renderResult({ state: "valid", name: card.name, sub: card.sub });
    toast("+1 πόντος «Παρών»: " + card.name, "ok");
  }

  /* ---- Παραγωγή tokens για την προσομοίωση -------------------------------- */
  function makeToken(kind, cardCode) {
    if (kind === "live") return Token.build(cardCode);

    if (kind === "stale") {
      /* token από πριν 5 λεπτά : σωστή υπογραφή, αλλά εκτός παραθύρου */
      const past = Date.now() - 5 * 60 * 1000;
      return Token.build(cardCode, past);
    }

    if (kind === "forged") {
      /* σωστή δομή, λάθος υπογραφή */
      const w = Token.windowIndex();
      return "ION1|" + cardCode + "|" + w + "|" + hash32("WRONG-SECRET|" + w);
    }
    return "";
  }

  $$("[data-scan]").forEach(btn => {
    btn.addEventListener("click", function () {
      const [kind, cardCode] = btn.getAttribute("data-scan").split(":");
      processToken(makeToken(kind, cardCode));
    });
  });

  $("#manualForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    const raw = $("#tokenInput").value.trim();
    if (!raw) { toast("Επικολλήστε έναν κωδικό"); return; }
    processToken(raw);
  });

  $("#resetBtn").addEventListener("click", function () {
    Store.remove(LOG_KEY);
    updateCount();
    renderIdle();
    toast("Το ημερήσιο αρχείο σαρώσεων μηδενίστηκε", "ok");
  });

  /* ---- Ένδειξη δικτύου ---------------------------------------------------- */
  function netSync() {
    const badge = $("#netBadge");
    if (navigator.onLine) {
      badge.className = "badge badge--ok";
      badge.textContent = "ONLINE";
    } else {
      badge.className = "badge badge--warn";
      badge.textContent = "OFFLINE READY";
    }
  }
  window.addEventListener("online", netSync);
  window.addEventListener("offline", netSync);
  netSync();

  updateCount();
  renderIdle();
})();
