/* ==========================================================================
   ΙΩΝΙΚΟΣ 1965 :: Εφαρμογή Μέλους (κινητό)
   Οθόνες 01, 03 (πλευρά μέλους), 04 και το Live tab.
   ========================================================================== */
(function () {
  "use strict";

  const D = window.ION_DATA;
  const { Auth, Membership, Trophies, Store, Token, QR, el, $, fmtEuro, mmss, levelById, levelColor, toast, celebrate, upper } = window.ION;

  const account = Auth.require(["member"]);
  if (!account) return;

  /* ---- Τοπική κατάσταση -------------------------------------------------- */
  const state = {
    tab: tabFromHash() || Store.get("app:tab", "card"),
    offerFilter: "all",
    chatRoom: "match",
    voted: Store.get("poll:voted", null),
    playing: false
  };

  let liveQR = null;        // handle του ζωντανού QR
  let ambientTimer = null;  // προσομοίωση μηνυμάτων κερκίδας
  let hypeStop = null;      // χρονόμετρα αντιδράσεων/θορύβου στο Live

  /** Άνοιγμα συγκεκριμένης καρτέλας από σύνδεσμο, π.χ. app.html#profile. */
  function tabFromHash() {
    const h = (location.hash || "").replace("#", "");
    return ["card", "offers", "live", "level", "profile"].indexOf(h) > -1 ? h : null;
  }

  const TABS = [
    { id: "card",   label: "Κάρτα",     icon: "card" },
    { id: "offers", label: "Προσφορές", icon: "tag" },
    { id: "live",   label: "Live",      icon: "play" },
    { id: "level",  label: "Επίπεδο",   icon: "medal" },
    { id: "profile",label: "Προφίλ",    icon: "user" }
  ];

  const CAPTIONS = {
    card:   "Ψηφιακή κάρτα και οικογενειακό προφίλ. Εναλλαγή ενήλικα ή παιδιού με ένα tap. Το QR ανανεώνεται αυτόματα κάθε 60 δευτερόλεπτα.",
    offers: "Εκπτώσεις χορηγών. Πατήστε μια προσφορά για να εμφανιστεί ο κωδικός σάρωσης στο κατάστημα.",
    live:   "Ζωντανή μετάδοση ακαδημιών με κερκίδα και ψηφοφορία MVP.",
    level:  "Τα επίπεδα της κερκίδας, τα προνόμια και τα τρόπαια του φιλάθλου.",
    profile:"Προφίλ μέλους: συνδρομή, οικογένεια και αποσύνδεση."
  };

  /* ======================================================================
     Σκελετός
     ====================================================================== */
  const phone    = $("#phone");
  const view     = $("#view");
  const appbar   = $("#appbar");
  const tabbar   = $("#tabbar");
  const caption  = $("#caption");

  $("#sbIcons").innerHTML = icon("signal", 15, 1.6) + icon("wifi", 15, 1.6) + icon("battery", 20, 1.5);

  $("#logoutBtn").addEventListener("click", function () {
    Auth.logout();
    location.href = "login.html";
  });

  function renderTabs() {
    tabbar.innerHTML = "";
    TABS.forEach(t => {
      tabbar.appendChild(
        el("button", {
          class: "tabbar__btn" + (state.tab === t.id ? " is-active" : ""),
          type: "button",
          "aria-current": state.tab === t.id ? "page" : null,
          html: icon(t.icon, 22) + "<span>" + t.label + "</span>",
          onclick() { go(t.id); }
        })
      );
    });
  }

  function go(tab) {
    if (location.hash && location.hash !== "#" + tab) history.replaceState(null, "", location.pathname + location.search);
    state.tab = tab;
    Store.set("app:tab", tab);
    render();
  }

  function cleanup() {
    if (liveQR) { liveQR.stop(); liveQR = null; }
    if (ambientTimer) { clearInterval(ambientTimer); ambientTimer = null; }
    if (hypeStop) { hypeStop(); hypeStop = null; }
  }

  function render() {
    cleanup();
    const dark = state.tab === "live";
    phone.classList.toggle("phone--dark", dark);
    phone.querySelector(".phone__screen").classList.toggle("theme-dark", dark);

    view.innerHTML = "";
    appbar.className = "appbar" + (dark ? " appbar--ink" : "");
    appbar.innerHTML = "";

    ({
      card:    viewCard,
      offers:  viewOffers,
      live:    viewLive,
      level:   viewLevel,
      profile: viewProfile
    })[state.tab]();

    caption.textContent = CAPTIONS[state.tab] || "";
    renderTabs();
  }

  /* ======================================================================
     Ψηφιακή κάρτα
     ====================================================================== */
  function viewCard() {
    const profile = Auth.activeProfile();

    appbar.append(
      el("img", { class: "crest crest--sm", src: "assets/img/crest.svg", alt: "" }),
      el("span", { class: "appbar__title", text: "ΙΩΝΙΚΟΣ PASS" }),
      el("button", {
        class: "appbar__action",
        type: "button",
        "aria-label": "Ειδοποιήσεις",
        html: icon("bell", 20),
        style: "color:var(--ion-gold)",
        onclick() { toast("Καμία νέα ειδοποίηση", null); }
      })
    );

    /* --- Εναλλαγή προφίλ --- */
    const switcher = el("div", { class: "segmented", role: "tablist" });
    Auth.profiles().forEach(p => {
      const active = p.id === profile.id;
      switcher.appendChild(
        el("button", {
          class: "segmented__btn" + (active ? " is-active" : ""),
          type: "button",
          role: "tab",
          "aria-selected": String(active),
          "data-tone": p.kind === "academy" ? "gold" : null,
          text: p.shortName + " (" + (p.kind === "academy" ? p.kindLabel : "Γονέας") + ")",
          onclick() { Auth.setActiveProfile(p.id); render(); }
        })
      );
    });

    /* --- Κάρτα --- */
    const isAcademy = profile.kind === "academy";
    const level = levelById(profile.levelId);
    const paused = Membership.get().status === "cancelled";

    const qrBox = el("div", { class: "qr" });
    const countdown = el("span", { class: "qr-countdown", text: "60s" });
    const timerFill = el("span", { style: "width:100%" });

    const card = el("div", {
      class: "pass" + (isAcademy ? " pass--academy" : "")
    }, [
      el("div", { class: "pass__band" }, [
        el("span", { text: isAcademy
          ? "Ακαδημία " + (profile.squad || "") + " (-" + profile.discountPct + "%)"
          : "Επίπεδο " + level.name }),
        el("span", { class: "pass__state" + (paused ? " is-off" : "") }, [
          el("span", { class: "dot" }),
          document.createTextNode(profile.statusLabel)
        ])
      ]),
      el("div", { class: "pass__head" }, [
        el("div", { class: "pass__club", text: "ΙΩΝΙΚΟΣ ΝΙΚΑΙΑΣ 1965" }),
        el("div", { class: "pass__name", text: profile.fullName }),
        el("div", { class: "pass__meta", text: isAcademy ? "Κάρτα παιδιού ακαδημίας" : "Κάρτα διαρκείας 2026" })
      ]),
      el("div", { class: "pass__perf", "aria-hidden": "true" }),
      el("div", { class: "pass__stub" }, [
        el("div", { class: "pass__qr" }, [qrBox]),
        el("div", { class: "pass__timer", "aria-hidden": "true" }, [timerFill]),
        el("div", { class: "pass__code" }, [
          el("span", {}, [document.createTextNode("Κωδικός "), el("b", { text: profile.cardCode })]),
          el("span", {}, [document.createTextNode("Νέο QR σε "), countdown])
        ]),
        isAcademy
          ? el("div", { class: "pass__consent", text: "Γονική συναίνεση για μετάδοση: ενεργή" })
          : null
      ])
    ]);

    view.append(
      el("div", { class: "stack" }, [
        Auth.profiles().length > 1 ? switcher : null,
        paused
          ? el("a", { class: "info", href: "web.html#subscription", style: "text-decoration:none;border-color:var(--danger)" }, [
              el("div", { class: "info__icon", style: "background:rgba(239,68,68,.14);color:var(--danger)", html: icon("warn", 20) }),
              el("div", {}, [
                el("div", { class: "info__title", text: "Η συνδρομή είναι σε παύση" }),
                el("div", { class: "info__text", text: "Η κάρτα δεν ανοίγει τη θύρα. Πατήστε για επανενεργοποίηση." })
              ])
            ])
          : null,
        card,
        window.ION.countdownCard(profile.id),
        window.ION.tripCard(profile.id),
        el("div", { class: "info" }, [
          el("div", { class: "info__icon", html: icon("refresh", 20) }),
          el("div", {}, [
            el("div", { class: "info__title", text: "Δυναμικός κωδικός QR" }),
            el("div", { class: "info__text", text: "Ο κωδικός αλλάζει αυτόματα κάθε 60 δευτερόλεπτα. Ένα στιγμιότυπο οθόνης δεν ανοίγει τη θύρα, άρα η κάρτα δεν δανείζεται." })
          ])
        ]),
        Auth.profiles().length < 2 ? null : el("div", { class: "info" }, [
          el("div", { class: "info__icon info__icon--navy", html: icon("users", 20) }),
          el("div", {}, [
            el("div", { class: "info__title", text: "Εναλλαγή προφίλ" }),
            el("div", { class: "info__text", text: "Ο γονέας δείχνει την κάρτα του παιδιού στην είσοδο, χωρίς να αποσυνδεθεί." })
          ])
        ]),
        el("button", {
          class: "btn btn--outline btn--block",
          type: "button",
          html: icon("refresh", 18) + "<span>Ανανέωση κωδικού</span>",
          onclick() { if (liveQR) { liveQR.refresh(); toast("Νέος κωδικός", "ok"); } }
        })
      ])
    );

    liveQR = QR.live(qrBox, profile.cardCode, {
      size: 168,
      dark: isAcademy ? "#343795" : "#181B4A",
      onTick(left, ttl) {
        countdown.textContent = left + "s";
        timerFill.style.width = Math.round((left / (ttl || 60)) * 100) + "%";
      }
    });
  }

  /* ======================================================================
     Προσφορές χορηγών (πλευρά μέλους)
     ====================================================================== */
  function viewOffers() {
    appbar.append(
      el("span", { class: "appbar__title", text: "Χορηγοί & Προσφορές" }),
      el("button", {
        class: "appbar__action", type: "button",
        "aria-label": "Φίλτρα", html: icon("sliders", 20),
        onclick() { toast("Φίλτρα κατηγορίας, απόστασης και λήξης"); }
      })
    );

    const filters = el("div", { class: "cluster" });
    D.OFFER_FILTERS.forEach(f => {
      const count = f.id === "all"
        ? D.OFFERS.length
        : D.OFFERS.filter(o => o.category === f.id).length;
      filters.appendChild(
        el("button", {
          class: "chip" + (state.offerFilter === f.id ? " is-active" : ""),
          type: "button",
          text: f.label + " (" + count + ")",
          onclick() { state.offerFilter = f.id; render(); }
        })
      );
    });

    const list = el("div", { class: "stack-3" });
    const visible = D.OFFERS.filter(
      o => state.offerFilter === "all" || o.category === state.offerFilter
    );

    visible.forEach((o, i) => {
      if (i === 0) {
        list.appendChild(
          el("div", {
            class: "offer-hero", role: "button", tabindex: "0",
            onclick() { openRedeem(o); },
            onkeydown(e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRedeem(o); } }
          }, [
            el("div", { class: "grow" }, [
              el("div", { class: "offer-hero__name", text: o.name }),
              el("div", { class: "offer-hero__sub", text: o.headline })
            ]),
            el("div", { class: "offer-hero__qr", html: icon("card", 22) })
          ])
        );
        return;
      }
      list.appendChild(
        el("div", {
          class: "row row--clickable", role: "button", tabindex: "0",
          onclick() { openRedeem(o); },
          onkeydown(e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRedeem(o); } }
        }, [
          el("div", { class: "row__icon", text: o.icon, style: "font-size:20px" }),
          el("div", { class: "row__body" }, [
            el("div", { class: "row__title", text: o.name }),
            el("div", { class: "row__meta", text: o.meta })
          ]),
          el("div", { class: "row__end ok", text: o.discount })
        ])
      );
    });

    view.append(el("div", { class: "stack" }, [filters, list]));
  }

  /** Bottom sheet με το QR εξαργύρωσης. */
  function openRedeem(offer) {
    const profile = Auth.activeProfile();
    const qrBox = el("div", { class: "qr" });
    const countdown = el("span", { class: "qr-countdown", text: "60s" });

    const sheet = el("div", { class: "sheet" }, [
      el("div", { class: "sheet__grab" }),
      el("div", { class: "sheet__title", text: offer.name }),
      el("div", { class: "badge badge--ok", text: offer.headline }),
      qrBox,
      el("p", { class: "t-sm muted", style: "margin:0" }, [document.createTextNode("Δείξτε τον κωδικό στο ταμείο. Ανανεώνεται σε "), countdown]),
      el("p", { class: "t-sm muted", text: "Απομένουν " + offer.usesLeft + "/" + offer.usesTotal + " χρήσεις αυτόν τον μήνα" }),
      el("button", {
        class: "btn btn--ghost btn--block", type: "button", text: "Κλείσιμο",
        onclick() { close(); }
      })
    ]);

    const backdrop = el("div", { class: "sheet-backdrop", onclick(e) { if (e.target === backdrop) close(); } }, [sheet]);
    phone.querySelector(".phone__screen").appendChild(backdrop);

    const handle = QR.live(qrBox, profile.cardCode + ":" + offer.id, {
      size: 164,
      onTick(left) { countdown.textContent = left + "s"; }
    });

    function close() { handle.stop(); backdrop.remove(); }
  }

  /* ======================================================================
     LIVE tab
     ====================================================================== */
  function viewLive() {
    const L = D.LIVE;

    appbar.append(
      el("span", { class: "badge badge--live", text: "LIVE" }),
      el("span", { class: "grow" }),
      el("span", { class: "display bold t-sm", text: "Κ16 Ακαδημία" })
    );

    const playBtn = el("button", {
      class: "player__play", type: "button",
      "aria-label": state.playing ? "Παύση" : "Αναπαραγωγή",
      html: icon(state.playing ? "pause" : "play", 32, 2),
      onclick() {
        state.playing = !state.playing;
        playBtn.innerHTML = icon(state.playing ? "pause" : "play", 32, 2);
        toast(state.playing ? "Η μετάδοση ξεκίνησε" : "Παύση", state.playing ? "ok" : null);
        if (state.playing) celebrate(Trophies.record(Auth.activeProfile().id, "watch"));
      }
    });

    const player = el("div", { class: "player" }, [
      el("div", { class: "player__bg" }),
      playBtn,
      el("div", { class: "player__caption", text: L.camera + " • " + L.watching + " Μέλη Παρακολουθούν" }),
      el("div", { class: "player__meta" }, [
        el("span", { class: "mono", text: L.clock + " • " + L.period })
      ])
    ]);

    const scoreLine = el("div", { class: "display bold", text: L.title + " " + window.ION.LiveScore.get() });
    const hype = window.ION.liveHype(player, score => { scoreLine.textContent = L.title + " " + score; });
    hypeStop = hype.stop;

    /* --- Κερκίδα --- */
    const chatScroll = el("div", { class: "chat__scroll" });
    const seeded = (D.CHAT_SEED[state.chatRoom] || []).slice();
    seeded.forEach(m => chatScroll.appendChild(chatMsg(m)));

    const input = el("input", {
      class: "chat__input", type: "text",
      placeholder: "Γράψτε μήνυμα στην κερκίδα…",
      maxlength: "140", "aria-label": "Μήνυμα κερκίδας"
    });

    const form = el("form", {
      class: "chat__form",
      onsubmit(e) {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        const p = Auth.activeProfile();
        pushMsg(chatScroll, { user: p.shortName, levelId: p.levelId, profileId: p.id, text: text, own: true });
        input.value = "";
        celebrate(Trophies.record(p.id, "chat"));
      }
    }, [
      input,
      el("button", { class: "btn btn--gold btn--icon", type: "submit", "aria-label": "Αποστολή", html: icon("send", 18) })
    ]);

    view.append(el("div", { class: "stack" }, [
      el("div", { class: "live-pin" }, [player, hype.el]),
      scoreLine,
      pollBlock(function (label, pct) {
        pushMsg(chatScroll, { user: "Ιωνικός TV", levelId: "ultra", text: "Ψηφίσατε " + label + " για MVP. Μαζί σας το " + pct + "% της κερκίδας." });
      }),
      window.ION.predictionCard(Auth.activeProfile().id),
      el("div", { class: "display bold gold t-sm", text: "Κερκίδα Live (" + L.stand + " online)" }),
      chatScroll,
      form,
      standingsCard()
    ].filter(Boolean)));

    /* Προσομοίωση κίνησης στην κερκίδα */
    ambientTimer = setInterval(function () {
      const m = D.CHAT_AMBIENT[Math.floor(Math.random() * D.CHAT_AMBIENT.length)];
      pushMsg(chatScroll, m);
    }, 5200);
  }

  const chatMsg = m => window.ION.chatLine(m);

  /** Βαθμολογία της ανδρικής ομάδας ποδοσφαίρου (οι ακαδημίες δεν έχουν δημοσιευμένους πίνακες). */
  function standingsCard() {
    const t = D.STANDINGS.leagues.find(l => l.id === "football");
    return el("div", { class: "card card--ink", style: "display:grid;gap:10px;padding:14px" }, [
      el("div", { class: "between" }, [
        el("span", { class: "display bold", text: "Ποδόσφαιρο ανδρών" }),
        el("span", { class: "t-xs muted", text: t.competition })
      ]),
      window.ION.standingsTable(t, t, true),
      el("p", { class: "t-xs muted", style: "margin:0", text: "Πηγή: " + t.source.name + ", " + t.source.date }),
      el("a", { class: "btn btn--ghost btn--sm btn--block", href: "web.html#standings", text: "Όλες οι βαθμολογίες" })
    ]);
  }

  function pushMsg(scroll, m) {
    scroll.appendChild(chatMsg(m));
    while (scroll.children.length > 40) scroll.removeChild(scroll.firstChild);
    scroll.scrollTop = scroll.scrollHeight;
  }

  function pollBlock(onVoted) {
    const poll = D.POLL;
    if (state.voted) return null;   /* έχετε ψηφίσει: η κάρτα φεύγει */
    const votes = Store.get("poll:counts", poll.options.reduce((a, o) => (a[o.id] = o.votes, a), {}));
    const total = Object.values(votes).reduce((a, b) => a + b, 0) || 1;

    const box = el("div", { class: "poll" }, [el("div", { class: "poll__q", text: poll.question })]);

    poll.options.forEach(o => {
      const pct = Math.round((votes[o.id] / total) * 100);
      const picked = state.voted === o.id;
      box.appendChild(
        el("button", {
          class: "poll__opt" + (picked ? " is-picked" : ""),
          type: "button",
          disabled: !!state.voted,
          onclick() {
            votes[o.id] += 1;
            Store.set("poll:counts", votes);
            Store.set("poll:voted", o.id);
            state.voted = o.id;
            toast("Η ψήφος σας καταγράφηκε", "ok");
            celebrate(Trophies.record(Auth.activeProfile().id, "vote"));
            box.remove();
            const newTotal = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
            onVoted(o.label, Math.round((votes[o.id] / newTotal) * 100));
          }
        }, [
          el("span", { class: "poll__fill", style: "width:" + pct + "%" }),
          el("span", { class: "poll__label", text: o.label }),
          el("span", { class: "poll__pct", text: pct + "%" })
        ])
      );
    });

    return box;
  }

  /* ======================================================================
     Επίπεδα & παράσημα
     ====================================================================== */
  function viewLevel() {
    const profile = Auth.activeProfile();
    const level = levelById(profile.levelId);
    const next = D.LEVELS.find(l => l.order === level.order + 1);

    appbar.append(
      el("span", { class: "appbar__title", text: "Το επίπεδό μου" }),
      el("span", { class: "grow" }),
      el("span", { class: "display bold t-sm gold", text: "Μέλος " + profile.monthsMember + (profile.monthsMember === 1 ? " μήνα" : " μήνες") })
    );

    const span = next ? next.minMonths - level.minMonths : 1;
    const done = Math.min(span, profile.monthsMember - level.minMonths);
    const pct = Math.round((done / span) * 100);
    const remaining = next ? Math.max(0, next.minMonths - profile.monthsMember) : 0;

    const card = el("div", { class: "levelcard" }, [
      el("div", { class: "levelcard__row" }, [
        el("div", { class: "levelcard__name", html: upper(level.name) + (level.en ? "<br>(" + upper(level.en) + ")" : "") }),
        next ? el("div", { class: "levelcard__next", text: "Επόμενο: " + upper(next.name) + " (" + next.minMonths + " μήνες)" }) : null
      ]),
      el("div", { class: "progress" }, [el("div", { class: "progress__bar", style: "width:" + pct + "%" })]),
      el("div", {
        class: "levelcard__hint",
        text: next
          ? "Ακόμα " + remaining + (remaining === 1 ? " μήνας" : " μήνες") + " για το επίπεδο " + next.name
          : "Έχετε φτάσει στο ανώτατο επίπεδο."
      })
    ]);

    const trophies = trophyBlock(profile.id);

    const ladder = el("div", { class: "ladder" });
    D.LEVELS.forEach(l => {
      let cls = "ladder__item";
      if (l.id === level.id)        cls += " is-current";
      if (l.order === D.LEVELS.length - 1) cls += " is-high";
      if (l.order === D.LEVELS.length)     cls += " is-top";
      ladder.appendChild(
        el("div", { class: cls, "data-level": l.id }, [
          el("div", {}, [
            el("div", { class: "ladder__range", text: l.range }),
            el("div", { class: "ladder__name", text: l.order + ". " + l.name + (l.en ? " (" + l.en + ")" : "") })
          ]),
          el("div", { class: "ladder__perk", text: l.perk })
        ])
      );
    });

    view.append(el("div", { class: "stack" }, [
      card,
      el("div", { class: "card", style: "display:grid;gap:10px;padding:14px" }, [
        el("div", { class: "between" }, [
          el("span", { class: "section-title", text: "Κατάταξη εβδομάδας" }),
          el("span", { class: "display bold", style: "color:var(--accent-text, var(--ion-navy))", text: window.ION.Leaderboard.points(profile.id) + " πόντοι" })
        ]),
        el("span", { class: "badge", style: "justify-self:start", text: "Δεδομένα επίδειξης" }),
        window.ION.leaderboardTable(profile.id, 5),
        el("a", { class: "btn btn--ghost btn--sm btn--block", href: "web.html#stand", text: "Όλη η κατάταξη" })
      ]),
      el("h3", { class: "section-title", text: "Τρόπαια" }),
      trophies,
      el("h3", { class: "section-title", text: "Τα 6 επίπεδα της κερκίδας" }),
      ladder
    ]));
  }

  /** Σύνοψη ανά βαθμίδα και πλέγμα τροπαίων με πρόοδο για τα κλειδωμένα. */
  function trophyBlock(pid) {
    const s = Trophies.summary(pid);
    const summary = el("div", { class: "trophy-summary" }, [
      el("div", { class: "trophy-summary__count" }, [
        el("b", { text: String(s.unlocked) }),
        document.createTextNode(" από " + s.total)
      ]),
      el("div", { class: "trophy-summary__tiers" },
        ["platinum", "gold", "silver", "bronze"].map(tier =>
          el("span", { class: "trophy-summary__tier trophy-tier--" + tier, title: D.TIERS[tier].label }, [
            el("span", { class: "tier-dot" }),
            document.createTextNode(String(s[tier]))
          ])
        ))
    ]);

    const grid = el("div", { class: "trophy-grid" });
    Trophies.forProfile(pid).forEach(t => {
      grid.appendChild(
        el("div", { class: "trophy trophy-tier--" + t.tier + (t.unlocked ? "" : " trophy--locked") }, [
          el("div", { class: "trophy__icon", html: icon(t.unlocked ? t.icon : "lock", 20) }),
          el("div", { class: "trophy__tier", text: D.TIERS[t.tier].label }),
          el("div", { class: "trophy__name", text: t.name }),
          el("div", { class: "trophy__text", text: t.text }),
          t.unlocked ? null : el("div", { class: "trophy__progress" }, [
            el("div", { class: "progress" }, [
              el("div", { class: "progress__bar", style: "width:" + Math.round((t.progress / t.goal) * 100) + "%" })
            ]),
            el("span", { class: "mono", text: t.progress + "/" + t.goal })
          ])
        ])
      );
    });
    return el("div", { class: "stack-3" }, [summary, grid]);
  }

  /** Επιλογή τίτλου για το chat, από τα ξεκλείδωτα τρόπαια. */
  function titlePicker(pid) {
    const current = Trophies.title(pid);
    const box = el("div", { class: "cluster", style: "gap:8px", role: "radiogroup", "aria-label": "Τίτλος στο chat" });
    const unlocked = Trophies.forProfile(pid).filter(t => t.unlocked);
    [{ id: null, name: "Χωρίς τίτλο", tier: null }].concat(unlocked).forEach(t => {
      const selected = (current ? current.id : null) === t.id;
      box.appendChild(
        el("button", {
          class: "chip" + (selected ? " is-active" : "") + (t.tier ? " trophy-tier--" + t.tier : ""),
          type: "button", role: "radio", "aria-checked": String(selected),
          title: t.tier ? D.TIERS[t.tier].label : null,
          onclick() {
            if (!Trophies.setTitle(pid, t.id)) return;
            toast(t.id ? "Ο τίτλος σας: " + t.name : "Χωρίς τίτλο στο chat", "ok");
            render();
          }
        }, [
          t.tier ? el("span", { class: "tier-dot" }) : null,
          document.createTextNode(t.name)
        ])
      );
    });
    return box;
  }

  /* ======================================================================
     Προφίλ
     ====================================================================== */
  function viewProfile() {
    const profile = Auth.activeProfile();
    const B = D.BILLING;

    appbar.append(
      el("span", { class: "appbar__title", text: "Προφίλ" }),
      el("button", {
        class: "appbar__action", type: "button", "aria-label": "Ρυθμίσεις",
        html: icon("gear", 20), onclick() { toast("Ρυθμίσεις λογαριασμού"); }
      })
    );

    const family = el("div", { class: "stack-3" });
    Auth.profiles().forEach(p => {
      family.appendChild(
        el("div", { class: "row" }, [
          el("div", { class: "row__icon", html: icon(p.kind === "academy" ? "shield" : "user", 20) }),
          el("div", { class: "row__body" }, [
            el("div", { class: "row__title", text: p.fullName }),
            el("div", { class: "row__meta", text: p.kindLabel + " • " + levelById(p.levelId).name + " • " + p.cardCode })
          ]),
          el("div", { class: "row__end", text: fmtEuro(p.monthlyFee) })
        ])
      );
    });

    const T = Membership.totals();
    const total = T.perMonth;

    view.append(el("div", { class: "stack" }, [
      el("div", { class: "card card--rule" }, [
        el("div", { class: "between" }, [
          el("div", {}, [
            el("div", { class: "card__title", text: account.displayName }),
            el("div", { class: "card__meta", text: account.email })
          ]),
          Membership.get().status === "cancelled"
            ? el("span", { class: "badge badge--danger", text: "ΣΕ ΠΑΥΣΗ" })
            : el("span", { class: "badge badge--ok", text: "ΕΝΕΡΓΟ" })
        ])
      ]),

      el("h3", { class: "section-title", text: Auth.profiles().length > 1 ? "Η οικογένειά μου" : "Η συνδρομή μου" }),
      family,

      el("div", { class: "card" }, [
        el("div", { class: "between" }, [
          el("span", { class: "bold", text: "Σύνολο Μήνα (Αυτόματη Χρέωση)" }),
          el("span", { class: "display bold t-lg", text: fmtEuro(total) })
        ]),
        el("p", { class: "t-sm muted", style: "margin:8px 0 0", text: T.cycle.label + " πλάνο • " + (Auth.profiles().length === 1 ? "1 μέλος" : Auth.profiles().length + " μέλη")
          + (Auth.profiles().some(p => p.kind === "academy") ? " • έκπτωση ακαδημίας " + B.academyDiscountPct + "%" : "") })
      ]),

      el("h3", { class: "section-title", text: "Τίτλος στο chat" }),
      el("p", { class: "t-sm muted", style: "margin:-8px 0 0", text: "Διαλέξτε ποιο τρόπαιο φαίνεται δίπλα στο όνομά σας στην κερκίδα." }),
      titlePicker(profile.id),

      el("a", { class: "btn btn--primary btn--block", href: "web.html#subscription", text: "Διαχείριση συνδρομής" }),
      el("a", { class: "btn btn--ghost btn--block", href: "web.html#events", text: "Εκδηλώσεις & Εισιτήρια" }),
      el("button", {
        class: "btn btn--ghost btn--block", type: "button",
        html: icon("logout", 18) + "<span>Αποσύνδεση</span>",
        onclick() { Auth.logout(); location.href = "login.html"; }
      }),
      el("button", {
        class: "btn btn--ghost btn--sm btn--block", type: "button", text: "Επαναφορά δεδομένων επίδειξης",
        onclick() {
          Membership.reset();
          Trophies.reset();
          window.ION.LiveScore.reset();
          window.ION.Predictions.reset();
          window.ION.Trips.reset();
          ["activeProfile", "poll:voted", "poll:counts", "app:tab"].forEach(k => Store.remove(k));
          toast("Τα δεδομένα επανήλθαν στην αρχική τους μορφή", "ok");
          render();
        }
      }),
      el("p", { class: "t-xs muted center", text: "Ενεργό προφίλ: " + profile.fullName })
    ]));
  }

  /* ---- Εκκίνηση ---------------------------------------------------------- */
  render();
  window.addEventListener("beforeunload", cleanup);
  window.addEventListener("hashchange", function () { const t = tabFromHash(); if (t && t !== state.tab) go(t); });
})();
