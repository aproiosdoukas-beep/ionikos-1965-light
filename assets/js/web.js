/* ==========================================================================
   ΙΩΝΙΚΟΣ 1965 — Ιστοσελίδα
   Οθόνη 05 (Live + VOD + Κερκίδα), 06 (Checkout), 07 (Εκδηλώσεις)
   ========================================================================== */
(function () {
  "use strict";

  const D = window.ION_DATA;
  const { Auth, Store, Token, QR, el, $, $$, fmtEuro, levelById, levelColor, toast } = window.ION;

  const ROUTES = [
    { id: "live",         label: "Live Αγώνες" },
    { id: "vod",          label: "Αρχείο VOD" },
    { id: "events",       label: "Εκδηλώσεις" },
    { id: "subscription", label: "Συνδρομή" }
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
      who.textContent = acc.displayName;
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
    ({ live: viewLive, vod: viewVod, events: viewEvents, subscription: viewSubscription })[currentRoute()]();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  window.addEventListener("hashchange", render);

  /* ======================================================================
     ΟΘΟΝΗ 05 — Ζωντανή μετάδοση, κερκίδα, ψηφοφορία
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
        toast(playing ? "Η μετάδοση ξεκίνησε (demo)" : "Παύση", playing ? "ok" : null);
      }
    });

    const player = el("div", { class: "player player--web" }, [
      el("div", { class: "player__bg" }),
      el("span", { class: "badge badge--live player__badge", text: "LIVE " + L.quality }),
      el("span", { class: "player__watermark", text: "Watermark: " + watermark() }),
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

    const title = el("h3", {
      style: "font-size:var(--fs-lg);font-weight:800;margin-bottom:16px",
      text: L.competition + ": " + L.title + " (" + L.score + ")"
    });

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
        push({ user: p ? p.shortName : acc.displayName, levelId: p ? p.levelId : "newcomer", text: text });
        input.value = "";
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

    sidebar.append(roomTabs, pollBlock(render), chatScroll, form);
    loadRoom("match");

    const timer = setInterval(function () {
      if (room !== "match") return;
      push(D.CHAT_AMBIENT[Math.floor(Math.random() * D.CHAT_AMBIENT.length)]);
    }, 5000);
    onCleanup(() => clearInterval(timer));

    /* --- VOD teaser --- */
    const teaser = el("div", { class: "grid-2", style: "margin-top:20px" });
    D.VOD.slice(0, 2).forEach(v => teaser.appendChild(vodRow(v)));

    page.append(
      head("Οθόνη 05 · Web App: Live Streaming Ακαδημιών & Κερκίδα",
           "Ζωντανή Μετάδοση Αγώνων, Αρχείο VOD & Δωμάτια Συζήτησης"),
      el("div", { class: "grid-live" }, [
        el("div", {}, [title, player, teaser]),
        sidebar
      ])
    );
  }

  function watermark() {
    const p = Auth.activeProfile();
    return p ? p.cardCode : "ΕΠΙΣΚΕΠΤΗΣ";
  }

  function chatMsg(m) {
    const lv = levelById(m.levelId);
    return el("div", { class: "chat__msg" }, [
      el("span", {
        class: "chat__user",
        style: "color:" + levelColor(m.levelId),
        text: m.user + " (" + (lv.en || lv.name) + "): "
      }),
      document.createTextNode(m.text)
    ]);
  }

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
      style: "width:100%;text-align:left;background:var(--ink-700);border-color:#22304A;color:inherit;font:inherit",
      onclick() { toast("Αναπαραγωγή: " + v.title + " (demo)", "ok"); }
    }, [
      el("div", { class: "row__icon", html: icon("play", 20) }),
      el("div", { class: "row__body" }, [
        el("div", { class: "row__title", text: "VOD: " + v.title + " (" + v.score + ")" }),
        el("div", { class: "row__meta", text: v.date + " • Διάρκεια " + v.dur })
      ]),
      el("div", { class: "row__end gold", html: icon("play", 18) })
    ]);
  }

  function viewVod() {
    const list = el("div", { class: "grid-2" });
    D.VOD.forEach(v => list.appendChild(vodRow(v)));

    page.append(
      head("Αρχείο VOD", "Όλοι οι Αγώνες των Ακαδημιών σε Επανάληψη"),
      el("p", { class: "muted", style: "margin-top:-12px;margin-bottom:24px",
                text: "Διαθέσιμο σε όλα τα ενεργά μέλη. Κάθε μετάδοση φέρει υδατογράφημα με τον κωδικό του μέλους." }),
      list
    );
  }

  /* ======================================================================
     ΟΘΟΝΗ 07 — Εκδηλώσεις & ηλεκτρονικά εισιτήρια
     ====================================================================== */
  function viewEvents() {
    const profile = Auth.activeProfile();
    const level = profile ? levelById(profile.levelId) : null;

    const list = el("div", { class: "card", style: "background:var(--paper);color:var(--ink-700);display:grid;gap:16px" });
    list.appendChild(
      el("div", { class: "between" }, [
        el("h3", { class: "card__title", style: "font-size:var(--fs-lg)", text: "Προσεχείς Εκδηλώσεις Ιωνικού" }),
        el("span", { class: "t-sm display bold", style: "color:var(--ion-navy)", text: "ΠΡΟΠΩΛΗΣΗ ULTRA & LEGEND" })
      ])
    );

    D.EVENTS.forEach(ev => {
      const priceLine = ev.memberPrice === 0
        ? "Είσοδος Μέλους: ΔΩΡΕΑΝ • Μη-Μέλη: " + fmtEuro(ev.guestPrice)
        : "Τιμή Μέλους: " + fmtEuro(ev.memberPrice) + " • Τιμή Μη-Μέλους: " + fmtEuro(ev.guestPrice);

      list.appendChild(
        el("div", {
          class: "row",
          style: "align-items:flex-start;background:var(--paper-50);border-color:var(--paper-200)"
        }, [
          el("div", { class: "row__body" }, [
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
      head("Οθόνη 07 · Εκδηλώσεις Συλλόγου & Ηλεκτρονικά Εισιτήρια",
           "Καλοκαιρινά Events, Προτεραιότητα Βάσει Level & Εισιτήριο QR"),
      level
        ? el("p", { class: "muted", style: "margin-top:-12px;margin-bottom:24px",
                    text: "Το επίπεδό σας: " + level.name + " — " + level.perk })
        : el("p", { class: "muted", style: "margin-top:-12px;margin-bottom:24px",
                    text: "Συνδεθείτε για τιμές μέλους και προτεραιότητα προπώλησης." }),
      el("div", { class: "grid-2" }, [list, ticketPane])
    );
  }

  function renderTicketPlaceholder(pane) {
    pane.innerHTML = "";
    pane.appendChild(
      el("div", {
        class: "card card--ink",
        style: "display:grid;gap:12px;justify-items:center;text-align:center;min-height:360px;align-content:center"
      }, [
        el("div", { html: icon("ticket", 44, 1.4), style: "color:var(--ink-400)" }),
        el("div", { class: "card__title", text: "Κανένα εισιτήριο ακόμη" }),
        el("p", { class: "t-sm muted", style: "margin:0;max-width:280px",
                  text: "Επιλέξτε μια εκδήλωση για να εκδοθεί το ηλεκτρονικό σας εισιτήριο με QR." })
      ])
    );
  }

  function issueTicket(ev) {
    const acc = Auth.account();
    if (!acc) { toast("Συνδεθείτε για κράτηση", "danger"); location.href = "login.html?next=web.html"; return; }

    const profile = Auth.activeProfile();
    const pane = $("#ticketPane");
    pane.innerHTML = "";

    const qrBox = el("div", { class: "qr" });
    const countdown = el("span", { class: "qr-countdown gold", text: "60s" });

    pane.appendChild(
      el("div", {
        class: "card card--ink",
        style: "display:grid;gap:14px;justify-items:center;text-align:center"
      }, [
        el("div", { class: "between", style: "width:100%" }, [
          el("span", { class: "t-xs display bold gold", style: "letter-spacing:.07em", text: "ΕΙΣΙΤΗΡΙΟ ΕΚΔΗΛΩΣΗΣ" }),
          el("span", { class: "t-xs display bold ok" }, [
            el("span", { class: "dot", style: "margin-right:6px" }),
            document.createTextNode("ΕΓΚΥΡΟ")
          ])
        ]),
        el("div", { class: "card__title", style: "font-size:var(--fs-lg)", text: ev.title }),
        el("div", { class: "t-sm muted", text: ev.date.toLowerCase() + " " + ev.time + " • " + ev.gate }),
        qrBox,
        el("div", { class: "t-sm" }, [
          document.createTextNode("Ανανέωση κωδικού σε "), countdown
        ]),
        el("div", { class: "t-sm muted", text: "Σαρώνεται με τον ίδιο Gate Scanner της εισόδου" }),
        el("div", { class: "t-sm" }, [
          document.createTextNode("Κάτοχος: "),
          el("b", { text: profile ? profile.fullName : acc.displayName })
        ]),
        el("button", {
          class: "btn btn--ghost btn--block", type: "button", text: "Νέα επιλογή",
          style: "--btn-fg:#F4F7FC;--btn-bd:#2A3A57",
          onclick() { handle.stop(); renderTicketPlaceholder(pane); }
        })
      ])
    );

    const code = (profile ? profile.cardCode : "ION-GUEST") + ":" + ev.id;
    const handle = QR.live(qrBox, code, {
      size: 176,
      onTick(left) { countdown.textContent = left + "s"; }
    });
    onCleanup(() => handle.stop());

    toast(ev.memberPrice === 0 ? "Δωρεάν QR εκδόθηκε" : "Κράτηση ολοκληρώθηκε — " + fmtEuro(ev.memberPrice), "ok");
  }

  /* ======================================================================
     ΟΘΟΝΗ 06 — Checkout: οικογενειακό καλάθι & επανεγγραφή
     ====================================================================== */
  function viewSubscription() {
    const B = D.BILLING;
    const acc = Auth.account();
    const profiles = acc ? Auth.profiles() : [D.PROFILES.p_giorgos, D.PROFILES.p_kostis];

    /* --- 1. Οικογενειακό καλάθι --- */
    const basket = el("div", {
      class: "card",
      style: "background:var(--paper-50);color:var(--ink-700);border-color:var(--paper-200);display:grid;gap:16px"
    });

    basket.appendChild(
      el("div", { class: "between" }, [
        el("h3", { class: "card__title", style: "font-size:var(--fs-lg)", text: "1. Οικογενειακό Καλάθι Συνδρομής" }),
        el("span", { class: "t-sm display bold ok", text: "ΧΩΡΙΣ ΚΕΝΟ" })
      ])
    );

    let total = 0;
    profiles.forEach(p => {
      total += p.monthlyFee;
      basket.appendChild(
        el("div", { class: "row", style: "background:var(--paper);border-color:var(--paper-200)" }, [
          el("div", { class: "row__body" }, [
            el("div", { class: "row__title", text: p.fullName + " (" + (p.kind === "academy" ? "Ακαδημία Κ14" : "Ενήλικας") + ")" }),
            p.discountLabel
              ? el("div", { class: "t-sm bold ok", text: p.discountLabel })
              : el("div", { class: "row__meta", text: "Μηνιαία Συνδρομή Μέλους" })
          ]),
          el("div", {
            class: "row__end",
            style: "font-size:var(--fs-lg);color:" + (p.discountLabel ? "var(--ok-600)" : "var(--ink-700)"),
            text: fmtEuro(p.monthlyFee)
          })
        ])
      );
    });

    basket.append(
      el("hr", { class: "divider" }),
      el("div", { class: "between" }, [
        el("span", { class: "display bold", style: "font-size:var(--fs-md)", text: "Σύνολο Μήνα (Αυτόματη Χρέωση)" }),
        el("span", { class: "display bold", style: "font-size:var(--fs-xl);color:var(--ion-navy)", text: fmtEuro(total) })
      ]),
      el("button", {
        class: "btn btn--primary btn--lg btn--block",
        type: "button",
        text: "ΠΛΗΡΩΜΗ ΜΕ ΚΑΡΤΑ / APPLE PAY / VIVA",
        onclick() {
          if (!acc) { location.href = "login.html?next=web.html"; return; }
          toast("Demo: δεν εκτελείται πραγματική πληρωμή", null, 3400);
        }
      }),
      el("p", { class: "t-xs muted center", style: "margin:0",
                text: "Mockup παρουσίασης — δεν συνδέεται με Stripe/Viva και δεν γίνεται καμία χρέωση." })
    );

    /* --- 2. Επιστροφή μετά από διακοπή --- */
    const gapMonths = 2;
    const reFee = gapMonths * B.reactivationPerMonth;
    const reTotal = B.baseFee + reFee;

    const reactivate = el("div", {
      class: "card",
      style: "background:var(--ink-900);border-color:#1A2639;display:grid;gap:16px"
    }, [
      el("div", { class: "between" }, [
        el("h3", { class: "card__title", style: "font-size:var(--fs-lg)", text: "2. Οθόνη Επιστροφής Μετά από Διακοπή" }),
        el("span", { class: "t-sm display bold gold", html: "ΚΕΝΟ 60<br>ΗΜΕΡΩΝ", style: "text-align:right" })
      ]),
      el("div", {
        style: "border-left:4px solid var(--ion-gold);padding:12px 16px;border-radius:0 12px 12px 0;background:var(--ink-700)"
      }, [
        el("div", { class: "display bold gold", text: "Ενημέρωση Επιπέδου:" }),
        el("div", { class: "t-sm", text: "Λόγω απουσίας >" + B.downgradeAfterDays + " ημερών, επιστρέφετε ως «Οπαδός» (από Ultra)." })
      ]),
      el("div", { class: "row", style: "background:var(--ink-700);border-color:#22304A" }, [
        el("div", { class: "row__body" }, [el("div", { class: "row__title", text: "Βασική Μηνιαία Συνδρομή" })]),
        el("div", { class: "row__end", style: "font-size:var(--fs-md)", text: fmtEuro(B.baseFee) })
      ]),
      el("div", { class: "row", style: "background:var(--ink-700);border-color:#22304A" }, [
        el("div", { class: "row__body" }, [
          el("div", { class: "row__title danger", text: "Τέλος Επανεγγραφής (" + gapMonths + " μήνες απουσίας)" }),
          el("div", { class: "row__meta", text: fmtEuro(B.reactivationPerMonth) + " / μήνα κενού (Χρεώνεται μόνο μία φορά)" })
        ]),
        el("div", { class: "row__end danger", style: "font-size:var(--fs-md)", text: "+" + fmtEuro(reFee) })
      ]),
      el("div", { class: "between" }, [
        el("span", { class: "display bold", style: "font-size:var(--fs-md)", text: "Πρώτη Πληρωμή Επιστροφής" }),
        el("span", { class: "display bold gold", style: "font-size:var(--fs-xl)", text: fmtEuro(reTotal) })
      ]),
      el("button", {
        class: "btn btn--gold btn--lg btn--block",
        type: "button",
        text: "ΕΠΑΝΕΝΕΡΓΟΠΟΙΗΣΗ ΣΥΝΔΡΟΜΗΣ",
        onclick() { toast("Demo: δεν εκτελείται πραγματική πληρωμή", null, 3400); }
      })
    ]);

    page.append(
      head("Οθόνη 06 · Web Checkout: Οικογενειακή Πληρωμή & Επανεγγραφή",
           "Διαφανής Ανάλυση Ποσού Πριν την Πληρωμή"),
      el("div", { class: "grid-2" }, [basket, reactivate])
    );
  }

  /* ---- Εκκίνηση ---------------------------------------------------------- */
  render();
})();
