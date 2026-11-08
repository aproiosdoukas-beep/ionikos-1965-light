/* ==========================================================================
   ΙΩΝΙΚΟΣ 1965 :: Ιστοσελίδα
   Live + VOD + Κερκίδα, Εκδηλώσεις, Συνδρομή
   ========================================================================== */
(function () {
  "use strict";

  const D = window.ION_DATA;
  const { Auth, Membership, Trophies, Store, Token, QR, el, $, $$, fmtEuro, levelById, levelColor, toast, celebrate, upper } = window.ION;

  const ROUTES = [
    { id: "live",         label: "Live Αγώνες" },
    { id: "vod",          label: "Αρχείο VOD" },
    { id: "standings",    label: "Βαθμολογίες" },
    { id: "stand",        label: "Κερκίδα" },
    { id: "events",       label: "Εκδηλώσεις" },
    { id: "subscription", label: "Συνδρομή" },
    { id: "history",      label: "Ιστορία" }
  ];

  const page = $("#page");
  let cleanupFns = [];

  function onCleanup(fn) { cleanupFns.push(fn); }
  function cleanup() { cleanupFns.forEach(f => { try { f(); } catch (_) {} }); cleanupFns = []; }

  /* ---- Πλοήγηση ---------------------------------------------------------- */
  function currentRoute() {
    const h = (location.hash || "").replace("#", "");
    return ROUTES.some(r => r.id === h) ? h : "live";
  }

  function renderNav() {
    const nav = $("#webLinks");
    const active = currentRoute();
    nav.innerHTML = "";
    ROUTES.forEach(r => {
      nav.appendChild(
        el("button", {
          class: "web__link" + (r.id === active ? " is-active" : ""),
          type: "button",
          html: (r.id === "live" ? '<span class="dot dot--gold" style="margin-right:6px"></span>' : "") + r.label,
          onclick() { location.hash = r.id; }
        })
      );
    });
  }

  function renderAuth() {
    const acc = Auth.account();
    const btn = $("#authBtn");
    const who = $("#whoami");
    if (acc) {
      const HOME = { member: "app.html#profile", admin: "admin.html", gate: "scanner.html", merchant: "merchant.html" };
      who.innerHTML = icon("user", 16) + "<span></span>";
      who.lastChild.textContent = acc.displayName;
      who.href = HOME[acc.role] || "app.html#profile";
      who.classList.remove("hidden");
      btn.textContent = "ΑΠΟΣΥΝΔΕΣΗ";
      btn.href = "#";
      btn.onclick = function (e) { e.preventDefault(); Auth.logout(); location.reload(); };
    } else {
      who.classList.add("hidden");
      btn.textContent = "ΣΥΝΔΕΣΗ";
      btn.href = "login.html";
      btn.onclick = null;
    }
  }

  function head(eyebrow, title) {
    return el("div", { class: "page-head" }, [
      el("div", { class: "eyebrow", text: eyebrow }),
      el("h2", { text: title })
    ]);
  }

  function render() {
    cleanup();
    page.innerHTML = "";
    renderNav();
    renderAuth();
    ({ live: viewLive, vod: viewVod, standings: viewStandings, stand: viewStand, events: viewEvents, subscription: viewSubscription, history: viewHistory })[currentRoute()]();
    syncNavHeight();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  window.addEventListener("hashchange", render);

  /* Το ύψος της κεφαλίδας αλλάζει στο κινητό: το βίντεο καρφιτσώνεται ακριβώς από κάτω. */
  function syncNavHeight() {
    const nav = document.querySelector(".web__nav");
    if (nav) document.documentElement.style.setProperty("--nav-h", nav.offsetHeight + "px");
  }
  if ("ResizeObserver" in window) new ResizeObserver(syncNavHeight).observe(document.querySelector(".web__nav"));
  window.addEventListener("resize", syncNavHeight);
  syncNavHeight();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncNavHeight);

  /* ======================================================================
     Ζωντανή μετάδοση, κερκίδα, ψηφοφορία
     ====================================================================== */
  function viewLive() {
    const L = D.LIVE;
    let playing = false;

    const playBtn = el("button", {
      class: "player__play", type: "button", "aria-label": "Αναπαραγωγή",
      html: icon("play", 34, 2),
      onclick() {
        playing = !playing;
        playBtn.innerHTML = icon(playing ? "pause" : "play", 34, 2);
        toast(playing ? "Η μετάδοση ξεκίνησε" : "Παύση", playing ? "ok" : null);
        const viewer = Auth.activeProfile();
        if (playing && viewer) celebrate(Trophies.record(viewer.id, "watch"));
      }
    });

    const player = el("div", { class: "player player--web" }, [
      el("div", { class: "player__bg" }),
      el("span", { class: "badge badge--live player__badge", text: "LIVE " + L.quality }),
      el("span", { class: "player__watermark", text: "Υδατογράφημα: " + watermark() }),
      playBtn,
      el("div", { class: "player__caption", text: L.camera + " • " + L.watching + " Μέλη Παρακολουθούν" }),
      el("div", { class: "player__meta" }, [
        el("button", { type: "button", "aria-label": "Παύση", html: icon("pause", 18, 2.2) }),
        el("button", { type: "button", "aria-label": "Ένταση", html: icon("volume", 18) }),
        el("span", { class: "mono", text: L.clock + " • " + L.period }),
        el("span", { class: "grow" }),
        el("button", { type: "button", "aria-label": "Πλήρης οθόνη", html: icon("expand", 18) })
      ])
    ]);

    const title = el("div", { class: "scoreline" }, [
      el("span", { class: "scoreline__comp", text: L.competition }),
      el("span", { class: "scoreline__teams", text: L.title }),
      el("span", { class: "scoreline__score", text: window.ION.LiveScore.get() })
    ]);

    /* --- Κερκίδα --- */
    const sidebar = el("aside", { class: "card card--ink", style: "display:grid;gap:16px;align-content:start" });

    const roomTabs = el("div", { class: "cluster", style: "gap:8px" });
    let room = "match";

    const chatScroll = el("div", { class: "chat__scroll", style: "max-height:300px" });

    function loadRoom(id) {
      room = id;
      chatScroll.innerHTML = "";
      (D.CHAT_SEED[id] || []).forEach(m => chatScroll.appendChild(chatMsg(m)));
      $$(".chip", roomTabs).forEach(c => c.classList.toggle("is-active", c.dataset.room === id));
    }

    D.CHAT_ROOMS.forEach(r => {
      roomTabs.appendChild(
        el("button", {
          class: "chip", type: "button", "data-room": r.id, text: r.label,
          onclick() { loadRoom(r.id); }
        })
      );
    });

    const input = el("input", {
      class: "chat__input", type: "text", maxlength: "140",
      placeholder: "Γράψτε μήνυμα στην κερκίδα…", "aria-label": "Μήνυμα κερκίδας"
    });

    const form = el("form", {
      class: "chat__form",
      onsubmit(e) {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        const acc = Auth.account();
        if (!acc) {
          toast("Συνδεθείτε για να γράψετε στην κερκίδα", "danger");
          return;
        }
        const p = Auth.activeProfile();
        push({ user: p ? p.shortName : acc.displayName, levelId: p ? p.levelId : "touristas", profileId: p ? p.id : null, own: true, text: text });
        input.value = "";
        if (p) celebrate(Trophies.record(p.id, "chat"));
      }
    }, [
      input,
      el("button", { class: "btn btn--gold btn--icon", type: "submit", "aria-label": "Αποστολή", html: icon("send", 18) })
    ]);

    function push(m) {
      chatScroll.appendChild(chatMsg(m));
      while (chatScroll.children.length > 50) chatScroll.removeChild(chatScroll.firstChild);
      chatScroll.scrollTop = chatScroll.scrollHeight;
    }

    const viewer = Auth.activeProfile();
    sidebar.append(roomTabs, pollBlock(render), window.ION.predictionCard(viewer ? viewer.id : null), chatScroll, form);
    loadRoom("match");

    const hype = window.ION.liveHype(player, score => {
      title.querySelector(".scoreline__score").textContent = score;
      if (room === "match") push({ user: "Ιωνικός TV", levelId: "ultra", text: "ΓΚΟΛ! Ο Ιωνικός κάνει το " + score + "." });
    });
    onCleanup(() => hype.stop());

    const timer = setInterval(function () {
      if (room !== "match") return;
      push(D.CHAT_AMBIENT[Math.floor(Math.random() * D.CHAT_AMBIENT.length)]);
    }, 5000);
    onCleanup(() => clearInterval(timer));

    /* --- VOD teaser --- */
    const teaser = el("div", { class: "grid-2" });
    D.VOD.slice(0, 2).forEach(v => teaser.appendChild(vodRow(v)));

    page.append(
      el("section", { class: "matchday theme-dark crest-watermark" }, [
        head("Ιωνικός TV", "Ζωντανή μετάδοση και κερκίδα"),
        title,
        el("div", { class: "grid-live" }, [
          el("div", { class: "live-main" }, [player, hype.el]),
          sidebar
        ])
      ]),
      el("section", { class: "stack" }, [
        el("div", { class: "between" }, [
          el("h3", { class: "section-title", text: "Πρόσφατοι αγώνες" }),
          el("a", { class: "btn btn--ghost btn--sm", href: "#vod", text: "Όλο το αρχείο" })
        ]),
        teaser
      ])
    );
  }

  function watermark() {
    const p = Auth.activeProfile();
    return p ? p.cardCode : "ΕΠΙΣΚΕΠΤΗΣ";
  }

  const chatMsg = m => window.ION.chatLine(m);

  function pollBlock(rerender) {
    const poll = D.POLL;
    const counts = Store.get("poll:counts", poll.options.reduce((a, o) => (a[o.id] = o.votes, a), {}));
    const voted = Store.get("poll:voted", null);
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

    const box = el("div", { class: "poll" }, [el("div", { class: "poll__q", text: poll.question })]);

    poll.options.forEach((o, i) => {
      const pct = Math.round((counts[o.id] / total) * 100);
      box.appendChild(
        el("button", {
          class: "poll__opt" + (voted === o.id ? " is-picked" : ""),
          type: "button",
          disabled: !!voted,
          onclick() {
            if (!Auth.account()) { toast("Συνδεθείτε για να ψηφίσετε", "danger"); return; }
            counts[o.id] += 1;
            Store.set("poll:counts", counts);
            Store.set("poll:voted", o.id);
            toast("Η ψήφος σας καταγράφηκε", "ok");
            const voter = Auth.activeProfile();
            if (voter) celebrate(Trophies.record(voter.id, "vote"));
            rerender();
          }
        }, [
          el("span", { class: "poll__fill", style: "width:" + pct + "%" }),
          el("span", { class: "poll__label", text: (i + 1) + ". " + o.label }),
          el("span", { class: "poll__pct", text: pct + "%" })
        ])
      );
    });
    return box;
  }

  /* ======================================================================
     Αρχείο VOD
     ====================================================================== */
  function vodRow(v) {
    return el("button", {
      class: "row row--clickable",
      type: "button",
      style: "width:100%;text-align:left;color:inherit;font:inherit;margin:0",
      onclick() { toast("Αναπαραγωγή: " + v.title, "ok"); }
    }, [
      el("div", { class: "row__icon", html: icon("play", 20) }),
      el("div", { class: "row__body" }, [
        el("div", { class: "row__title", text: "VOD: " + v.title + " (" + v.score + ")" }),
        el("div", { class: "row__meta", text: v.date + " • Διάρκεια " + v.dur })
      ]),
      el("div", { class: "row__end", style: "color:var(--ion-gold-600)", html: icon("play", 18) })
    ]);
  }

  function viewVod() {
    const list = el("div", { class: "grid-2" });
    D.VOD.forEach(v => list.appendChild(vodRow(v)));

    page.append(
      head("Αρχείο VOD", "Οι αγώνες των ακαδημιών σε επανάληψη"),
      el("p", { class: "page-lead",
                text: "Διαθέσιμο σε όλα τα ενεργά μέλη. Κάθε βίντεο φέρει υδατογράφημα με τον κωδικό του μέλους." }),
      list
    );
  }

  /* ======================================================================
     Βαθμολογίες: άθλημα, κατηγορία, πίνακας και αγώνες του Ιωνικού
     ====================================================================== */
  let standingsSel = "football";

  function viewStandings() {
    const S = D.STANDINGS;
    const league = S.leagues.find(l => l.id === standingsSel) || S.leagues[0];

    const sportSwitch = el("div", { class: "segmented", role: "tablist", "aria-label": "Άθλημα" },
      S.leagues.map(l => el("button", {
        class: "segmented__btn" + (l.id === league.id ? " is-active" : ""),
        type: "button", role: "tab", "aria-selected": String(l.id === league.id),
        text: l.label + " " + l.team.toLowerCase(),
        onclick() { standingsSel = l.id; render(); }
      })));

    page.append(
      head("Βαθμολογίες", "Οι ομάδες του Ιωνικού"),
      el("p", { class: "page-lead", text: "Οι βαθμολογίες των ομάδων μας στα πρωταθλήματά τους. Για την πιο πρόσφατη εικόνα πατήστε «Ζωντανή βαθμολογία»." }),
      el("div", { style: "margin-bottom:24px;max-width:640px" }, [sportSwitch]),
      standingsBody(league),
      el("div", { class: "card", style: "margin-top:20px;display:flex;gap:12px;align-items:flex-start" }, [
        el("div", { class: "row__icon", html: icon("users", 20) }),
        el("div", {}, [
          el("div", { class: "card__title", text: "Ακαδημίες" }),
          el("p", { class: "t-sm muted", style: "margin:4px 0 0", text: S.academies })
        ])
      ])
    );
  }

  /** Πίνακας ή σημείωμα, με πηγή, τελευταίο αποτέλεσμα, επόμενο αγώνα και ζωντανή βαθμολογία. */
  function standingsBody(league) {
    const liveBtn = el("a", {
      class: "btn btn--primary btn--sm", href: league.liveUrl, target: "_blank", rel: "noopener",
      text: "Ζωντανή βαθμολογία (" + league.liveName + ")"
    });
    const sourceLine = el("p", { class: "t-xs muted", style: "margin:0" }, [
      document.createTextNode("Πηγή: "),
      el("a", { href: league.source.url, target: "_blank", rel: "noopener", text: league.source.name }),
      document.createTextNode(", " + league.source.date)
    ]);

    const tableCard = el("div", { class: "card card--rule", style: "display:grid;gap:12px" }, [
      el("div", { class: "between", style: "flex-wrap:wrap" }, [
        el("div", {}, [
          el("h3", { class: "section-title", text: league.competition }),
          el("div", { class: "t-sm muted", text: league.label + " " + league.team.toLowerCase() })
        ]),
        liveBtn
      ]),
      league.rows
        ? el("div", { style: "overflow-x:auto" }, [window.ION.standingsTable(league, league, false)])
        : el("div", { class: "empty", style: "min-height:180px" }, [
            el("div", { class: "empty__icon", html: icon("chart", 36, 1.5) }),
            el("p", { class: "t-sm", style: "margin:0;max-width:360px", text: league.note })
          ]),
      sourceLine
    ]);

    const matchCard = (label, m, isNext) => el("div", { class: "card match-card" + (isNext ? " card--navy theme-dark" : "") }, [
      el("div", { class: "eyebrow", text: label }),
      m.text
        ? el("div", { class: "card__title", text: m.text })
        : el("div", { class: "match-card__teams" }, [
            el("span", { text: m.home }),
            el("b", { class: "match-card__score", text: isNext ? m.time : m.score }),
            el("span", { text: m.away })
          ]),
      m.date ? el("div", { class: "t-sm muted", text: isNext ? m.date + ", " + m.venue : m.date }) : null
    ]);

    return el("div", { class: "grid-live", style: "align-items:start" }, [
      tableCard,
      el("div", { class: "stack" }, [
        league.last ? matchCard("Τελευταίο αποτέλεσμα", league.last, false) : null,
        league.next ? matchCard("Επόμενος αγώνας", league.next, true) : null
      ])
    ]);
  }

  /* ======================================================================
     Ιστορία του συλλόγου
     ====================================================================== */
  const SPORT_LABEL = { football: "Ποδόσφαιρο", basketball: "Μπάσκετ", club: "Σύλλογος" };

  function viewHistory() {
    const H = D.HISTORY;
    page.append(
      el("section", { class: "matchday theme-dark crest-watermark history-hero" }, [
        el("div", { class: "eyebrow", text: "Ιστορία" }),
        el("h2", { class: "history-hero__title", text: "Από το 1965 στη Νίκαια" }),
        el("p", { class: "history-hero__intro", text: H.intro })
      ]),
      el("div", { class: "grid-3", style: "margin-bottom:40px" }, H.facts.map(f =>
        el("div", { class: "card card--rule history-fact" }, [
          el("div", { class: "eyebrow", text: f.label }),
          el("p", { text: f.value })
        ]))),
      el("h3", { class: "section-title", style: "font-size:var(--fs-xl);margin-bottom:16px", text: "Οι σταθμοί" }),
      el("ol", { class: "timeline" }, H.timeline.map(t =>
        el("li", { class: "timeline__item" }, [
          el("div", { class: "timeline__year", text: t.year }),
          el("div", { class: "timeline__body" }, [
            el("span", { class: "chip timeline__sport is-" + t.sport, text: SPORT_LABEL[t.sport] }),
            el("h4", { class: "timeline__title", text: t.title }),
            el("p", { class: "timeline__text", text: t.text })
          ])
        ]))),
      el("div", { class: "card", style: "margin-top:40px;display:grid;gap:12px" }, [
        el("h3", { class: "section-title", text: "Τα τμήματα" }),
        el("div", { class: "cluster", style: "gap:8px" }, H.sections.map(s => el("span", { class: "chip", text: s })))
      ]),
      el("div", { class: "history-sources" }, [
        el("h4", { class: "card__title", text: "Πηγές" }),
        el("ul", {}, H.sources.map(s => el("li", {}, [
          el("a", { href: s.url, target: "_blank", rel: "noopener", text: s.name })
        ])))
      ])
    );
  }

  /* ======================================================================
     Κερκίδα: κατάταξη φιλάθλων, εκδρομή, επόμενος εντός έδρας
     ====================================================================== */
  function viewStand() {
    const profile = Auth.activeProfile();
    const board = el("div", { class: "card card--rule", style: "display:grid;gap:12px" }, [
      el("div", { class: "between", style: "flex-wrap:wrap" }, [
        el("h3", { class: "section-title", text: "Κατάταξη εβδομάδας" }),
        el("span", { class: "badge", text: "Δεδομένα επίδειξης" })
      ]),
      el("p", { class: "t-sm muted", style: "margin:0",
                text: "Πόντοι: 1 ανά μήνυμα, 5 ανά είσοδο στο γήπεδο ή εκδρομή, 10 για ακριβή πρόβλεψη, 3 για σωστό σημείο, 2 ανά εισιτήριο." }),
      profile
        ? el("div", { style: "overflow-x:auto" }, [window.ION.leaderboardTable(profile.id)])
        : el("p", { class: "t-sm", style: "margin:0", text: "Συνδεθείτε για να δείτε τη θέση σας στην κατάταξη." })
    ]);
    const side = el("div", { class: "stack", id: "standSide" });
    page.append(
      head("Κερκίδα", "Η κατάταξη της εβδομάδας"),
      el("div", { class: "grid-live", style: "align-items:start" }, [board, side])
    );
    standSideCards.forEach(fn => { const c = fn(profile); if (c) side.appendChild(c); });
  }
  /* Κάρτες της στήλης «Κερκίδα» (εκδρομή, αντίστροφη μέτρηση). */
  const standSideCards = [
    profile => window.ION.countdownCard(profile ? profile.id : null, "login.html?next=web.html"),
    profile => window.ION.tripCard(profile ? profile.id : null)
  ];

  /* ======================================================================
     Εκδηλώσεις & ηλεκτρονικά εισιτήρια
     ====================================================================== */
  function viewEvents() {
    const profile = Auth.activeProfile();
    const level = profile ? levelById(profile.levelId) : null;

    const list = el("div", { class: "card card--rule", style: "display:grid;gap:16px" });
    list.appendChild(
      el("div", { class: "between", style: "flex-wrap:wrap" }, [
        el("h3", { class: "section-title", text: "Προσεχείς εκδηλώσεις" }),
        el("span", { class: "badge badge--gold", text: "Προτεραιότητα από Hooligan" })
      ])
    );

    D.EVENTS.forEach(ev => {
      const priceLine = ev.memberPrice === 0
        ? "Είσοδος Μέλους: ΔΩΡΕΑΝ • Μη-Μέλη: " + fmtEuro(ev.guestPrice)
        : "Τιμή Μέλους: " + fmtEuro(ev.memberPrice) + " • Τιμή Μη-Μέλους: " + fmtEuro(ev.guestPrice);

      list.appendChild(
        el("div", {
          class: "row",
          style: "align-items:center;flex-wrap:wrap;background:var(--surface-2);margin:0"
        }, [
          el("div", { class: "row__body", style: "flex:1 1 220px" }, [
            el("div", {
              class: "t-xs display bold",
              style: "letter-spacing:.07em;color:" + (ev.tone === "gold" ? "var(--ion-gold-600)" : "var(--ok-600)"),
              text: ev.date + " • " + ev.venue
            }),
            el("div", { class: "row__title", style: "font-size:var(--fs-md);margin:4px 0", text: ev.title }),
            el("div", { class: "row__meta", html: priceLine.replace(/(ΔΩΡΕΑΝ|[\d,]+€)/g, "<b>$1</b>") })
          ]),
          el("button", {
            class: "btn btn--" + ev.ctaVariant,
            type: "button",
            text: ev.cta,
            onclick() { issueTicket(ev); }
          })
        ])
      );
    });

    const ticketPane = el("div", { id: "ticketPane" });
    renderTicketPlaceholder(ticketPane);

    page.append(
      head("Εκδηλώσεις", "Εκδηλώσεις του συλλόγου"),
      level
        ? el("p", { class: "page-lead",
                    text: "Το επίπεδό σας: " + level.name + ". " + level.perk })
        : el("p", { class: "page-lead",
                    text: "Συνδεθείτε για να δείτε τις τιμές μέλους και να κλείσετε θέση νωρίτερα." }),
      el("div", { class: "grid-2", style: "align-items:start" }, [list, ticketPane])
    );
  }

  function renderTicketPlaceholder(pane) {
    pane.innerHTML = "";
    pane.appendChild(
      el("div", { class: "empty" }, [
        el("div", { class: "empty__icon", html: icon("ticket", 44, 1.4) }),
        el("div", { class: "card__title", text: "Δεν έχετε εισιτήριο ακόμη" }),
        el("p", { class: "t-sm muted", style: "margin:0;max-width:280px",
                  text: "Επιλέξτε εκδήλωση και το ηλεκτρονικό εισιτήριο με QR θα εμφανιστεί εδώ." })
      ])
    );
  }

  function issueTicket(ev) {
    const acc = Auth.account();
    if (!acc) { toast("Συνδεθείτε για να κάνετε κράτηση", "danger"); location.href = "login.html?next=web.html"; return; }

    const profile = Auth.activeProfile();
    const pane = $("#ticketPane");
    pane.innerHTML = "";

    const qrBox = el("div", { class: "qr" });
    const countdown = el("span", { class: "qr-countdown", style: "color:#fff", text: "60s" });

    const timerFill = el("span", { style: "width:100%" });

    pane.appendChild(
      el("div", { class: "pass theme-dark", style: "--pass-hole:var(--paper-100)" }, [
        el("div", { class: "pass__band" }, [
          el("span", { text: "Εισιτήριο εκδήλωσης" }),
          el("span", { class: "pass__state" }, [el("span", { class: "dot" }), document.createTextNode("Έγκυρο")])
        ]),
        el("div", { class: "pass__head" }, [
          el("div", { class: "pass__club", text: "ΙΩΝΙΚΟΣ ΝΙΚΑΙΑΣ 1965" }),
          el("div", { class: "pass__name", style: "font-size:30px", text: ev.title }),
          el("div", { class: "pass__meta", text: ev.dateText + ", " + ev.time + ", " + ev.gate }),
          el("div", { class: "pass__meta" }, [
            document.createTextNode("Κάτοχος: "),
            el("b", { style: "color:#fff", text: profile ? profile.fullName : acc.displayName })
          ])
        ]),
        el("div", { class: "pass__perf", "aria-hidden": "true" }),
        el("div", { class: "pass__stub" }, [
          el("div", { class: "pass__qr" }, [qrBox]),
          el("div", { class: "pass__timer", "aria-hidden": "true" }, [timerFill]),
          el("div", { class: "pass__code" }, [
            el("span", {}, [document.createTextNode("Νέο QR σε "), countdown]),
            el("span", { text: "Σαρώνεται στην είσοδο" })
          ]),
          el("button", {
            class: "btn btn--ghost btn--block", type: "button", text: "Άλλη εκδήλωση",
            onclick() { handle.stop(); renderTicketPlaceholder(pane); }
          })
        ])
      ])
    );

    const code = (profile ? profile.cardCode : "ION-GUEST") + ":" + ev.id;
    const handle = QR.live(qrBox, code, {
      size: 176,
      onTick(left, ttl) {
        countdown.textContent = left + "s";
        timerFill.style.width = Math.round((left / (ttl || 60)) * 100) + "%";
      }
    });
    onCleanup(() => handle.stop());

    toast(ev.memberPrice === 0 ? "Εκδόθηκε δωρεάν εισιτήριο" : "Η κράτηση ολοκληρώθηκε (" + fmtEuro(ev.memberPrice) + ")", "ok");
    if (profile) celebrate(Trophies.record(profile.id, "ticket"));
  }


  /* ======================================================================
     ΣΥΝΔΡΟΜΗ
     Ίδια λογική με το design document: μία κάρτα «οικογενειακό καλάθι»
     όταν η συνδρομή είναι ενεργή, μία κάρτα «επιστροφή» όταν είναι σε παύση.
     ====================================================================== */
  function viewSubscription() {
    if (!Auth.account()) {
      page.append(
        head("Συνδρομή", "Η συνδρομή της οικογένειας"),
        el("div", { class: "card card--rule", style: "display:grid;gap:16px;justify-items:start;max-width:640px" }, [
          el("p", { class: "modal__text",
                    text: "Συνδεθείτε για να δείτε και να αλλάξετε τη συνδρομή της οικογένειάς σας." }),
          el("a", { class: "btn btn--primary", href: "login.html?next=web.html", text: "ΣΥΝΔΕΣΗ" })
        ])
      );
      return;
    }

    const M = Membership.get();
    const t = Membership.totals();

    page.append(
      head("Συνδρομή", "Η συνδρομή της οικογένειας"),
      el("div", { class: "grid-2", style: "align-items:start" }, [
        M.status === "cancelled" ? returnCard(t) : basketCard(M, t),
        plansCard()
      ])
    );
  }

  /* ---- Τι περιλαμβάνει κάθε πακέτο ------------------------------------- */
  function perkList(plan, compact) {
    return el("ul", { class: "perks" + (compact ? " perks--compact" : "") },
      plan.includes.map(item => el("li", { class: "perks__item" }, [
        el("span", { class: "perks__icon", html: icon("check", 13, 2.6) }),
        el("div", {}, [
          el("div", { class: "perks__title", text: item.title }),
          el("div", { class: "perks__text", text: item.text })
        ])
      ]))
    );
  }

  function plansCard() {
    return el("div", { class: "card card--navy theme-dark crest-watermark", style: "display:grid;grid-template-columns:minmax(0,1fr);gap:20px" }, [
      el("h3", { class: "section-title", text: "Τι περιλαμβάνει κάθε πακέτο" }),
      ...["adult", "academy"].map(id => {
        const plan = D.PLANS[id];
        return el("section", { class: "plan" }, [
          el("div", { class: "plan__head" }, [
            el("div", {}, [
              el("div", { class: "plan__name", text: plan.name }),
              el("div", { class: "plan__who", text: plan.who })
            ]),
            el("div", { class: "plan__price", html: fmtEuro(plan.price) + "<small>" + plan.priceNote + "</small>" })
          ]),
          perkList(plan, false)
        ]);
      })
    ]);
  }

  /* ---- 1. Οικογενειακό καλάθι (ενεργή συνδρομή) -------------------------- */
  function basketCard(M, t) {
    const yearly = M.cycle === "yearly";

    const cycleSwitch = el("div", { class: "segmented", role: "tablist", "aria-label": "Κύκλος χρέωσης" });
    [["monthly", "Μηνιαία"], ["yearly", "Ετήσια (2 μήνες δώρο)"]].forEach(([id, label]) => {
      cycleSwitch.appendChild(
        el("button", {
          class: "segmented__btn" + (M.cycle === id ? " is-active" : ""),
          type: "button", role: "tab", "aria-selected": String(M.cycle === id),
          text: label,
          onclick() { Membership.setCycle(id); render(); }
        })
      );
    });

    const rows = el("div", { class: "stack-3" });
    Auth.profiles().forEach(p => {
      rows.appendChild(
        el("div", { class: "row", style: "margin:0" }, [
          el("div", { class: "row__body" }, [
            el("div", { class: "row__title", text: p.fullName }),
            p.kind === "academy"
              ? el("div", { class: "t-sm bold", style: "color:var(--ok-600)",
                            text: D.PLANS.academy.name + " " + p.kindLabel + ", έκπτωση " + p.discountPct + "%" })
              : el("div", { class: "t-sm bold", style: "color:var(--ion-navy)",
                            text: D.PLANS.adult.name + " (ενήλικας)" }),
            el("div", { class: "row__meta", text: p.kind === "academy"
              ? "Είσοδος στους αγώνες, live του τμήματος, δωρεάν Summer Camp"
              : "Είσοδος σε όλους τους εντός έδρας αγώνες, Ιωνικός TV, εκπτώσεις" })
          ]),
          el("div", {
            class: "row__end",
            style: "font-size:var(--fs-lg);color:" + (p.discountPct ? "var(--ok-600)" : "var(--ink-700)"),
            text: fmtEuro(p.monthlyFee) + "/μήνα"
          }),
          p.removable
            ? el("button", {
                class: "btn btn--ghost btn--icon btn--sm", type: "button",
                "aria-label": "Αφαίρεση " + p.fullName, title: "Αφαίρεση",
                html: icon("cross", 16, 2),
                onclick() { confirmRemove(p); }
              })
            : el("span", { style: "width:36px" })
        ])
      );
    });

    return el("div", { class: "card card--rule", style: "display:grid;grid-template-columns:minmax(0,1fr);gap:18px" }, [
      el("div", { class: "between" }, [
        el("h3", { class: "section-title", text: "Οικογενειακό καλάθι συνδρομής" }),
        el("span", { class: "badge badge--ok", text: "Ενεργή" })
      ]),
      cycleSwitch,
      rows,
      el("button", {
        class: "btn btn--ghost btn--block", type: "button",
        html: icon("plus", 18) + "<span>Προσθήκη μέλους</span>",
        onclick: openAddMember
      }),
      el("hr", { class: "divider", style: "margin:0" }),
      el("div", { class: "between" }, [
        el("span", { class: "display bold", style: "font-size:var(--fs-md)",
                     text: yearly ? "Σύνολο έτους (αυτόματη χρέωση)" : "Σύνολο μήνα (αυτόματη χρέωση)" }),
        el("span", { class: "display bold mono", style: "font-size:var(--fs-2xl);font-stretch:var(--stretch-headline);line-height:1;color:var(--ion-navy)", text: fmtEuro(t.base) })
      ]),
      yearly
        ? el("p", { class: "t-sm bold", style: "margin:-8px 0 0;color:var(--ok-600)",
                    text: "12 μήνες στην τιμή των 10. Κερδίζετε " + fmtEuro(t.cycleSaving) + "." })
        : null,
      el("button", {
        class: "btn btn--primary btn--lg btn--block", type: "button",
        text: "ΠΛΗΡΩΜΗ ΜΕ ΚΑΡΤΑ / APPLE PAY / VIVA",
        onclick() { confirmPay(false); }
      }),
      el("div", { class: "between t-sm" }, [
        el("span", { class: "muted", text: "Επόμενη χρέωση: " + nextCharge(M) }),
        el("button", {
          class: "btn btn--ghost btn--sm", type: "button", text: "Παύση συνδρομής",
          onclick: confirmCancel
        })
      ])
    ]);
  }

  /* ---- 2. Επιστροφή μετά από διακοπή (συνδρομή σε παύση) ------------------ */
  function returnCard(t) {
    const downgrade = t.gapMonths * 30 > D.BILLING.downgradeAfterDays;
    const months = t.gapMonths === 1 ? "1 μήνας" : t.gapMonths + " μήνες";
    const gapTag = t.gapMonths === 1 ? "ΚΕΝΟ 1 ΜΗΝΑ" : "ΚΕΝΟ " + t.gapMonths + " ΜΗΝΩΝ";

    return el("div", { class: "card card--ink card--rule theme-dark", style: "display:grid;grid-template-columns:minmax(0,1fr);gap:16px" }, [
      el("div", { class: "between", style: "align-items:flex-start" }, [
        el("h3", { class: "section-title", text: "Επιστροφή μετά από διακοπή" }),
        el("span", { class: "t-sm display bold gold", style: "text-align:right", text: gapTag })
      ]),
      el("div", { style: "border-left:4px solid var(--ion-gold);padding:12px 16px;border-radius:0 10px 10px 0;background:var(--ink-800)" }, [
        el("div", { class: "display bold gold", text: "Ενημέρωση επιπέδου" }),
        el("div", { class: "t-sm", text: downgrade
          ? "Λόγω απουσίας άνω των " + D.BILLING.downgradeAfterDays + " ημερών, επιστρέφετε στο επίπεδο «Casual»."
          : "Επιστρέφοντας μέσα σε " + D.BILLING.downgradeAfterDays + " ημέρες, διατηρείτε το επίπεδό σας." })
      ]),
      el("div", { class: "row", style: "background:var(--ink-800);margin:0" }, [
        el("div", { class: "row__body" }, [el("div", { class: "row__title", text: t.cycle.id === "yearly" ? "Βασική ετήσια συνδρομή" : "Βασική μηνιαία συνδρομή" })]),
        el("div", { class: "row__end", style: "font-size:var(--fs-md)", text: fmtEuro(t.base) })
      ]),
      el("div", { class: "row", style: "background:var(--ink-800);margin:0" }, [
        el("div", { class: "row__body" }, [
          el("div", { class: "row__title", style: "color:var(--danger-300)", text: "Τέλος επανεγγραφής (" + months + " απουσίας)" }),
          el("div", { class: "row__meta", text: fmtEuro(D.BILLING.reactivationPerMonth) + " ανά μήνα κενού, χρεώνεται μία φορά" })
        ]),
        el("div", { class: "row__end", style: "font-size:var(--fs-md);color:var(--danger-300)", text: "+" + fmtEuro(t.reactivationFee) })
      ]),
      el("hr", { class: "divider", style: "margin:0" }),
      el("div", { class: "between" }, [
        el("span", { class: "display bold", style: "font-size:var(--fs-md)", text: "Πρώτη πληρωμή επιστροφής" }),
        el("span", { class: "display bold mono", style: "font-size:var(--fs-2xl);font-stretch:var(--stretch-headline);line-height:1;color:var(--ion-gold-300)", text: fmtEuro(t.total) })
      ]),
      el("button", {
        class: "btn btn--gold btn--lg btn--block", type: "button",
        text: "ΕΠΑΝΕΝΕΡΓΟΠΟΙΗΣΗ ΣΥΝΔΡΟΜΗΣ",
        onclick() { confirmPay(true); }
      })
    ]);
  }

  function nextCharge(M) {
    const d = new Date(M.lastPaidAt || Date.now());
    d.setMonth(d.getMonth() + (M.cycle === "yearly" ? 12 : 1));
    return new Intl.DateTimeFormat("el-GR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  }

  /* ---- Modal helper ------------------------------------------------------ */
  function modal(opts) {
    const box = el("div", { class: "modal theme-light", role: "dialog", "aria-modal": "true" });
    const backdrop = el("div", {
      class: "modal-backdrop",
      onclick(e) { if (e.target === backdrop) close(); }
    }, [box]);

    function close() { document.removeEventListener("keydown", onKey); backdrop.remove(); }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);

    box.append(
      el("div", { class: "modal__title", text: opts.title }),
      opts.text ? el("p", { class: "modal__text", text: opts.text }) : null
    );
    if (opts.body) box.appendChild(opts.body);

    box.appendChild(
      el("div", { class: "modal__actions", style: opts.noCancel ? "grid-template-columns:1fr" : null }, [
        el("button", {
          class: "btn " + (opts.confirmVariant || "btn--primary"),
          type: "button",
          text: opts.confirmLabel || "Επιβεβαίωση",
          onclick() { if (opts.onConfirm && opts.onConfirm() === false) return; close(); }
        }),
        opts.noCancel ? null : el("button", { class: "btn btn--ghost", type: "button", text: "Άκυρο", onclick: close })
      ])
    );

    document.body.appendChild(backdrop);
    return { close: close, box: box };
  }

  /* ---- Προσθήκη μέλους ---------------------------------------------------- */
  function openAddMember() {
    const nameInput = el("input", { class: "input", type: "text", placeholder: "Ονοματεπώνυμο", "aria-label": "Ονοματεπώνυμο" });
    const squadSelect = el("select", { class: "select", "aria-label": "Τμήμα ακαδημίας" },
      Membership.SQUADS.map(sq => el("option", { value: sq, text: sq, selected: sq === "Κ14" })));

    const squadField = el("div", { class: "field" }, [
      el("label", { class: "field__label", text: "Τμήμα Ακαδημίας" }),
      squadSelect
    ]);

    let kind = "academy";
    const kindBox = el("div", { class: "options options--row" });
    [
      { id: "academy", label: D.PLANS.academy.name, sub: fmtEuro(D.PLANS.academy.price) + " / μήνα" },
      { id: "adult",   label: D.PLANS.adult.name,   sub: fmtEuro(D.PLANS.adult.price) + " / μήνα" }
    ].forEach(opt => {
      kindBox.appendChild(
        el("button", {
          class: "option" + (opt.id === kind ? " is-selected" : ""),
          type: "button",
          "data-kind": opt.id,
          onclick() {
            kind = opt.id;
            $$(".option", kindBox).forEach(b => b.classList.toggle("is-selected", b.dataset.kind === kind));
            squadField.classList.toggle("hidden", kind !== "academy");
            showPerks();
          }
        }, [
          el("span", { class: "option__mark" }),
          el("span", { class: "option__body" }, [
            el("span", { class: "option__label", text: opt.label }),
            el("span", { class: "option__sub", text: opt.sub })
          ])
        ])
      );
    });

    const error = el("p", { class: "field__error hidden" });
    const perksBox = el("div", { class: "stack-2" });

    function showPerks() {
      perksBox.innerHTML = "";
      perksBox.append(
        el("div", { class: "field__label", text: "Περιλαμβάνει" }),
        perkList(D.PLANS[kind], true)
      );
    }

    const body = el("div", { class: "stack" }, [
      el("div", { class: "field" }, [
        el("label", { class: "field__label", text: "Ονοματεπώνυμο" }),
        nameInput
      ]),
      kindBox,
      squadField,
      perksBox,
      error
    ]);
    showPerks();

    modal({
      title: "Προσθήκη μέλους",
      text: "Κάθε νέο μέλος παίρνει τη δική του ψηφιακή κάρτα με QR.",
      body: body,
      confirmLabel: "Προσθήκη",
      confirmVariant: "btn--success",
      onConfirm() {
        const res = Membership.addMember({
          fullName: nameInput.value,
          kind: kind,
          squad: squadSelect.value
        });
        if (!res.ok) {
          error.textContent = res.error;
          error.classList.remove("hidden");
          return false;
        }
        toast("Προστέθηκε: " + res.member.fullName + " (" + res.member.cardCode + ")", "ok");
        render();
      }
    });

    setTimeout(() => nameInput.focus(), 60);
  }

  function confirmRemove(p) {
    modal({
      title: "Αφαίρεση μέλους",
      text: p.fullName + " θα αφαιρεθεί από τη συνδρομή και η κάρτα " + p.cardCode + " θα απενεργοποιηθεί.",
      confirmLabel: "Αφαίρεση",
      confirmVariant: "btn--danger",
      onConfirm() {
        const res = Membership.removeMember(p.id);
        toast(res.ok ? "Αφαιρέθηκε: " + p.fullName : res.error, res.ok ? "ok" : "danger");
        render();
      }
    });
  }

  function confirmCancel() {
    modal({
      title: "Παύση συνδρομής",
      text: "Οι κάρτες της οικογένειας θα σταματήσουν να ανοίγουν τη θύρα. Όταν επιστρέψετε, χρεώνεται τέλος επανεγγραφής "
        + fmtEuro(D.BILLING.reactivationPerMonth) + " για κάθε μήνα απουσίας.",
      confirmLabel: "Παύση συνδρομής",
      confirmVariant: "btn--danger",
      onConfirm() {
        Membership.cancel();
        toast("Η συνδρομή μπήκε σε παύση", "danger");
        render();
      }
    });
  }

  function confirmPay(reactivating) {
    const t = Membership.totals();
    let method = Membership.get().paymentMethod;

    const methods = el("div", { class: "options" });
    Membership.PAYMENT_METHODS.forEach(pm => {
      methods.appendChild(
        el("button", {
          class: "option" + (pm.id === method ? " is-selected" : ""),
          type: "button", "data-method": pm.id,
          onclick() {
            method = pm.id;
            $$(".option", methods).forEach(b => b.classList.toggle("is-selected", b.dataset.method === method));
          }
        }, [
          el("span", { class: "option__mark" }),
          el("span", { class: "option__body" }, [
            el("span", { class: "option__label", text: pm.label }),
            el("span", { class: "option__sub", text: pm.sub })
          ])
        ])
      );
    });

    modal({
      title: reactivating ? "Επανενεργοποίηση συνδρομής" : "Πληρωμή συνδρομής",
      text: "Ποσό: " + fmtEuro(t.total) + ". Επιλέξτε τρόπο πληρωμής.",
      body: el("div", { class: "stack-3" }, [
        methods,
        el("p", { class: "t-xs muted", style: "margin:0", text: "Πρωτότυπο παρουσίασης. Δεν πραγματοποιείται χρέωση." })
      ]),
      confirmLabel: "Πληρωμή " + fmtEuro(t.total),
      confirmVariant: "btn--success",
      onConfirm() {
        Membership.setPaymentMethod(method);
        const pm = Membership.PAYMENT_METHODS.find(x => x.id === method);
        const res = Membership.pay();
        showReceipt(res.charged, pm.label, res.reactivated);
        render();
      }
    });
  }

  function showReceipt(amount, method, reactivated) {
    const no = "A-" + Math.floor(100 + Math.random() * 900);
    modal({
      title: reactivated ? "Η συνδρομή επανενεργοποιήθηκε" : "Η πληρωμή ολοκληρώθηκε",
      text: "Απόδειξη " + no + " · " + fmtEuro(amount) + " με " + method
        + ". Οι κάρτες της οικογένειας είναι ενεργές.",
      confirmLabel: "Εντάξει",
      confirmVariant: "btn--success",
      noCancel: true,
      onConfirm() {}
    });
  }

  /* ---- Εκκίνηση ---------------------------------------------------------- */
  render();
})();
