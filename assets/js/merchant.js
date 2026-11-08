/* ==========================================================================
   ΙΩΝΙΚΟΣ 1965 :: Ταμείο καταστήματος-χορηγού
   ========================================================================== */
(function () {
  "use strict";

  const D = window.ION_DATA;
  const { Store, Token, Trophies, el, $, toast, celebrate, todayKey, resolveCard, upper } = window.ION;

  $("#sbIcons").innerHTML = icon("signal", 15, 1.6) + icon("wifi", 15, 1.6) + icon("battery", 20, 1.5);
  $("#storeIcon").innerHTML = icon("store", 24);

  const MERCHANT = D.OFFERS[0];                 // Nikaia Burgers
  const view = $("#tillView");
  const USES_KEY = "merchant:uses:" + MERCHANT.id;
  const STATS_KEY = "merchant:stats:" + MERCHANT.id + ":" + todayKey();

  /* Αιτιατική πτώση : το Intl επιστρέφει γενική ("Νοεμβρίου"). */
  const MONTHS_ACC = ["Ιανουάριο", "Φεβρουάριο", "Μάρτιο", "Απρίλιο", "Μάιο", "Ιούνιο",
                      "Ιούλιο", "Αύγουστο", "Σεπτέμβριο", "Οκτώβριο", "Νοέμβριο", "Δεκέμβριο"];
  const MONTH = MONTHS_ACC[new Date().getMonth()];
  const MONTHS_NOM = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος",
                      "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];

  function uses()  { return Store.get(USES_KEY, {}); }
  function stats() { return Store.get(STATS_KEY, { scans: 148, members: 82 }); }

  let pending = null;   // σαρωμένο, μη καταχωρημένο μέλος

  /* ---- Αναμονή ----------------------------------------------------------- */
  function renderIdle() {
    pending = null;
    view.innerHTML = "";
    view.appendChild(el("div", { class: "stack" }, [
      el("div", { class: "scan-state scan-state--idle", style: "min-height:auto" }, [
        el("div", { class: "scan-state__top" }, [
          el("span", { text: "ΤΑΜΕΙΟ" }),
          el("span", { class: "gold", text: "ΑΝΑΜΟΝΗ" })
        ]),
        el("div", { class: "scan-state__glyph scan-state__glyph--idle", html: icon("camera", 44, 1.5) }),
        el("div", {}, [
          el("div", { class: "scan-state__title", text: "ΣΑΡΩΣΤΕ QR ΜΕΛΟΥΣ" }),
          el("div", { class: "scan-state__sub", style: "margin-top:8px", text: MERCHANT.headline })
        ]),
        el("div", { class: "scan-state__action", text: "Ισχύει " + MERCHANT.usesTotal + " φορές τον μήνα ανά μέλος" })
      ]),
      statsBlock()
    ]));
  }

  /* ---- Στατιστικά -------------------------------------------------------- */
  function statsBlock() {
    const s = stats();
    return el("div", { class: "card card--ink" }, [
      el("div", {
        class: "t-xs display bold",
        style: "letter-spacing:.07em;color:var(--ink-300)",
        text: "ΣΤΑΤΙΣΤΙΚΑ ΚΑΤΑΣΤΗΜΑΤΟΣ (" + upper(MONTHS_NOM[new Date().getMonth()]) + ")"
      }),
      el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px" }, [
        el("div", { class: "stat" }, [
          el("div", { class: "stat__value", text: String(s.scans) }),
          el("div", { class: "stat__label", text: "Σαρώσεις QR" })
        ]),
        el("div", { class: "stat stat--ok" }, [
          el("div", { class: "stat__value", text: String(s.members) }),
          el("div", { class: "stat__label", text: "Πελάτες Μέλη" })
        ])
      ])
    ]);
  }

  /* ---- Αποτέλεσμα σάρωσης ------------------------------------------------ */
  function renderResult(ok, info) {
    view.innerHTML = "";

    const block = ok
      ? el("div", {
          class: "card",
          style: "background:linear-gradient(170deg,#11543E,#0C3B2C);border:1.5px solid var(--ok-300);color:#fff;text-align:center;display:grid;gap:10px;justify-items:center"
        }, [
          el("div", { html: icon("checks", 40, 2.4), style: "color:var(--ok-300)" }),
          el("div", { class: "display bold", style: "font-size:var(--fs-lg);line-height:1.15", html: "ΕΓΚΥΡΟ ΜΕΛΟΣ<br>ΙΩΝΙΚΟΥ" }),
          el("div", { class: "display bold gold", text: "Έκπτωση " + MERCHANT.discount + " στο Μενού" }),
          el("div", { class: "t-sm", style: "opacity:.85", text: info.usesLine })
        ])
      : el("div", {
          class: "card",
          style: "background:linear-gradient(170deg,#8E1A22,#6B1016);border:1.5px solid var(--danger-300);color:#fff;text-align:center;display:grid;gap:10px;justify-items:center"
        }, [
          el("div", { html: icon("cross", 40, 2.6), style: "color:var(--danger-300)" }),
          el("div", { class: "display bold", style: "font-size:var(--fs-lg)", text: info.title }),
          el("div", { class: "t-sm", style: "opacity:.85", text: info.sub })
        ]);

    const confirm = el("button", {
      class: "btn btn--success btn--lg btn--block",
      type: "button",
      disabled: !ok,
      text: "Επιβεβαίωση και καταγραφή",
      onclick() { commit(info); }
    });

    view.appendChild(el("div", { class: "stack" }, [
      el("div", { class: "between" }, [
        el("span", { class: "t-sm muted", text: info.name || "..." }),
        el("button", {
          class: "btn btn--ghost btn--sm", type: "button", text: "Άκυρο",
          
          onclick: renderIdle
        })
      ]),
      block,
      statsBlock(),
      confirm
    ]));
  }

  /* ---- Καταχώρηση -------------------------------------------------------- */
  function commit(info) {
    const u = uses();
    u[info.cardCode] = (u[info.cardCode] || 0) + 1;
    Store.set(USES_KEY, u);

    const s = stats();
    s.scans += 1;
    if (u[info.cardCode] === 1) s.members += 1;
    Store.set(STATS_KEY, s);

    toast("Καταγράφηκε: " + MERCHANT.discount + " για " + info.name, "ok");
    if (info.profileId) celebrate(Trophies.record(info.profileId, "redeem", MERCHANT.id));
    renderIdle();
  }

  /* ---- Επεξεργασία token -------------------------------------------------- */
  function processToken(raw) {
    /* Το QR προσφοράς έχει μορφή  <token>  όπου η κάρτα είναι "ION-xxxx:offerId" */
    const check = Token.verify(raw);

    if (!check.ok) {
      renderResult(false, {
        title: check.reason === "stale" ? "ΛΗΓΜΕΝΟΣ ΚΩΔΙΚΟΣ" : "ΜΗ ΕΓΚΥΡΟ QR",
        sub: check.reason === "stale"
          ? "Ζητήστε από το μέλος να ανανεώσει τον κωδικό"
          : "Ο κωδικός δεν επαληθεύτηκε"
      });
      return;
    }

    const cardCode = check.cardCode.split(":")[0];
    const card = resolveCard(cardCode);

    if (!card || card.state === "expired") {
      renderResult(false, {
        title: "ΛΗΓΜΕΝΗ ΣΥΝΔΡΟΜΗ",
        sub: card ? card.sub : "Η κάρτα δεν βρέθηκε στο μητρώο"
      });
      return;
    }

    const used = uses()[cardCode] || 0;
    if (used >= MERCHANT.usesTotal) {
      renderResult(false, {
        title: "ΕΞΑΝΤΛΗΘΗΚΑΝ ΟΙ ΧΡΗΣΕΙΣ",
        sub: "Το μέλος χρησιμοποίησε " + MERCHANT.usesTotal + "/" + MERCHANT.usesTotal + " για τον " + MONTH
      });
      return;
    }

    renderResult(true, {
      name: card.name,
      profileId: card.profileId || null,
      cardCode: cardCode,
      usesLine: "Χρήση " + (used + 1) + " από " + MERCHANT.usesTotal + " για τον " + MONTH
    });
  }

  /* ---- Κουμπιά προσομοίωσης ----------------------------------------------- */
  const sims = [
    { label: "Σάρωση: Γιώργος Παπαδόπουλος", variant: "success", card: "ION-8472", kind: "live" },
    { label: "Σάρωση: Κωστής Παπαδόπουλος",  variant: "primary", card: "ION-5513", kind: "live" },
    { label: "Σάρωση: Ληγμένη συνδρομή",     variant: "danger",  card: "ION-3301", kind: "live" },
    { label: "Σάρωση παλιού QR",              variant: "ghost",   card: "ION-8472", kind: "stale" }
  ];

  const simBox = $("#simButtons");
  sims.forEach(s => {
    simBox.appendChild(
      el("button", {
        class: "btn btn--" + s.variant + " btn--block",
        type: "button",
        text: s.label,
        style: s.variant === "ghost" ? null : null,
        onclick() {
          const at = s.kind === "stale" ? Date.now() - 5 * 60 * 1000 : undefined;
          processToken(Token.build(s.card + ":" + MERCHANT.id, at));
        }
      })
    );
  });

  $("#resetBtn").addEventListener("click", function () {
    Store.remove(USES_KEY);
    Store.remove(STATS_KEY);
    renderIdle();
    toast("Τα υπόλοιπα επαναφέρθηκαν", "ok");
  });

  renderIdle();
})();
