/* ==========================================================================
   ΙΩΝΙΚΟΣ 1965 :: Admin panel γραφείων συλλόγου
   ========================================================================== */
(function () {
  "use strict";

  const D = window.ION_DATA;
  const { Auth, Store, el, $, fmtEuro, levelById, toast } = window.ION;

  const account = Auth.require(["admin"]);
  if (!account) return;

  const SECTIONS = [
    { id: "desk",     label: "Μέλη & Γραφείο" },
    { id: "academy",  label: "Εγκρίσεις Ακαδημίας" },
    { id: "shops",    label: "Καταστήματα & Προσφορές" },
    { id: "matches",  label: "Αγώνες & Κόστος Stream" },
    { id: "reports",  label: "Οικονομικές Αναφορές" }
  ];

  const view = $("#adminView");
  let section = Store.get("admin:section", "desk");

  $("#logoutBtn").addEventListener("click", function () {
    Auth.logout();
    location.href = "login.html";
  });

  /* ---- Κατάσταση εγκρίσεων (επιμένει τοπικά) ----------------------------- */
  function handled() { return Store.get("admin:handled", {}); }
  function markHandled(id, outcome) {
    const h = handled();
    h[id] = outcome;
    Store.set("admin:handled", h);
  }

  function renderNav() {
    const nav = $("#adminNav");
    nav.innerHTML = "";
    SECTIONS.forEach(s => {
      const pending = s.id === "academy"
        ? D.ADMIN.academyRequests.filter(r => !handled()[r.id]).length
        : 0;
      nav.appendChild(
        el("button", {
          class: "admin__navbtn" + (s.id === section ? " is-active" : ""),
          type: "button",
          text: s.label + (s.id === "academy" ? " (" + pending + ")" : ""),
          onclick() { section = s.id; Store.set("admin:section", s.id); render(); }
        })
      );
    });
  }

  function head(eyebrow, title) {
    return el("div", { class: "page-head" }, [
      el("div", { class: "eyebrow", text: eyebrow }),
      el("h2", { text: title })
    ]);
  }

  function kpis() {
    const K = D.ADMIN.kpis;
    return el("div", { class: "grid-3", style: "margin-bottom:28px" }, [
      kpi("ΕΝΕΡΓΕΣ ΣΥΝΔΡΟΜΕΣ", String(K.activeSubscriptions), ""),
      kpi("ΜΗΝΙΑΙΑ ΕΣΟΔΑ", fmtEuro(K.monthlyRevenue), "ok"),
      kpi("ΚΟΣΤΟΣ LIVE STREAM", fmtEuro(K.streamCost) + " / μήνα", "navy")
    ]);
  }

  function kpi(label, value, tone) {
    return el("div", { class: "card" }, [
      el("div", { class: "t-xs display bold muted", style: "letter-spacing:.07em", text: label }),
      el("div", { class: "stat " + (tone ? "stat--" + tone : ""), style: "margin-top:8px" }, [
        el("div", { class: "stat__value", text: value })
      ])
    ]);
  }

  function render() {
    renderNav();
    view.innerHTML = "";
    ({ desk: viewDesk, academy: viewAcademy, shops: viewShops, matches: viewMatches, reports: viewReports })[section]();
  }

  /* ======================================================================
     Μέλη & Γραφείο
     ====================================================================== */
  function viewDesk() {
    view.append(head("Διαχείριση",
                     "Διαχείριση Μελών, Έγκριση Ακαδημιών & Πληρωμές στα Γραφεία"), kpis());

    /* --- Είσπραξη στο γραφείο --- */
    const payments = el("div", { class: "stack-3", style: "margin-bottom:28px" });
    D.ADMIN.deskPayments.forEach(p => {
      const done = handled()["pay_" + p.id];
      payments.appendChild(
        el("div", { class: "card" }, [
          el("div", { class: "between", style: "flex-wrap:wrap;gap:16px" }, [
            el("div", { class: "grow" }, [
              el("div", { class: "t-xs display bold muted", style: "letter-spacing:.07em",
                          text: "ΕΙΣΠΡΑΞΗ ΣΤΟ ΓΡΑΦΕΙΟ (" + p.method + ")" }),
              el("div", { class: "card__title", style: "margin:4px 0",
                          text: "Μέλος: " + p.member + " • Ποσό: " + fmtEuro(p.amount) + " (Απόδειξη " + p.receipt + ")" }),
              el("div", { class: "card__meta", text: "Άμεση ενεργοποίηση κάρτας ή έκδοση κωδικού μίας χρήσης" })
            ]),
            done
              ? el("span", { class: "badge badge--ok", text: done === "activated" ? "ΕΝΕΡΓΟΠΟΙΗΘΗΚΕ" : "ΚΩΔΙΚΟΣ ΕΚΔΟΘΗΚΕ" })
              : el("div", { class: "cluster", style: "gap:10px" }, [
                  el("button", {
                    class: "btn btn--success", type: "button", html: "ΕΝΕΡΓΟΠΟΙΗΣΗ<br>ΤΩΡΑ",
                    style: "line-height:1.2;text-align:center",
                    onclick() { markHandled("pay_" + p.id, "activated"); toast("Ενεργοποιήθηκε η κάρτα: " + p.member, "ok"); render(); }
                  }),
                  el("button", {
                    class: "btn btn--primary", type: "button", html: "ΕΚΔΟΣΗ<br>ΚΩΔΙΚΟΥ",
                    style: "line-height:1.2;text-align:center",
                    onclick() {
                      const code = "ION-" + Math.floor(1000 + Math.random() * 9000);
                      markHandled("pay_" + p.id, "code");
                      toast("Κωδικός μίας χρήσης: " + code, "ok", 5000);
                      render();
                    }
                  })
                ])
          ])
        ])
      );
    });

    /* --- Πίνακας μελών --- */
    const STATUS = {
      active:  { label: "Ενεργό",   cls: "badge--ok" },
      grace:   { label: "Περίοδος χάριτος",  cls: "badge--warn" },
      pending: { label: "Εκκρεμεί", cls: "badge--gold" }
    };

    const rows = D.ADMIN.members.map(m => el("tr", {}, [
      el("td", { html: "<b>" + m.name + "</b>" }),
      el("td", { text: levelById(m.level).name }),
      el("td", { text: m.since }),
      el("td", {}, [el("span", { class: "badge " + STATUS[m.status].cls, text: STATUS[m.status].label })]),
      el("td", { class: "bold", text: fmtEuro(m.fee) })
    ]));

    const table = el("div", { class: "card" }, [
      el("h3", { class: "card__title", style: "margin-bottom:12px", text: "Μητρώο Μελών" }),
      el("table", { class: "table" }, [
        el("thead", {}, [el("tr", {}, [
          el("th", { text: "Μέλος" }), el("th", { text: "Επίπεδο" }),
          el("th", { text: "Μέλος από" }), el("th", { text: "Κατάσταση" }),
          el("th", { text: "Συνδρομή" })
        ])]),
        el("tbody", {}, rows)
      ])
    ]);

    view.append(payments, table);
  }

  /* ======================================================================
     Εγκρίσεις ακαδημίας
     ====================================================================== */
  function viewAcademy() {
    view.append(head("Εγκρίσεις Ακαδημίας", "Αιτήματα Έκπτωσης -50% για Παιδιά Ακαδημιών"), kpis());

    const list = el("div", { class: "stack-3" });
    D.ADMIN.academyRequests.forEach(r => {
      const outcome = handled()[r.id];
      list.appendChild(
        el("div", { class: "card" }, [
          el("div", { class: "between", style: "flex-wrap:wrap;gap:16px" }, [
            el("div", { class: "grow" }, [
              el("div", { class: "t-xs display bold", style: "letter-spacing:.07em;color:var(--ion-gold-600)",
                          text: "ΑΙΤΗΜΑ ΕΚΠΤΩΣΗΣ ΑΚΑΔΗΜΙΑΣ (-50%)" }),
              el("div", { class: "card__title", style: "margin-top:4px",
                          text: "Παιδί: " + r.child + " (" + r.squad + ") • Γονέας: " + r.parent })
            ]),
            outcome
              ? el("span", {
                  class: "badge " + (outcome === "approved" ? "badge--ok" : "badge--danger"),
                  text: outcome === "approved" ? "ΕΓΚΡΙΘΗΚΕ" : "ΑΠΟΡΡΙΦΘΗΚΕ"
                })
              : el("div", { class: "cluster", style: "gap:10px" }, [
                  el("button", {
                    class: "btn btn--success", type: "button", text: "ΕΓΚΡΙΣΗ (" + fmtEuro(r.fee) + ")",
                    onclick() { markHandled(r.id, "approved"); toast("Εγκρίθηκε: " + r.child, "ok"); render(); }
                  }),
                  el("button", {
                    class: "btn btn--danger", type: "button", text: "ΑΠΟΡΡΙΨΗ",
                    onclick() { markHandled(r.id, "rejected"); toast("Απορρίφθηκε: " + r.child, "danger"); render(); }
                  })
                ])
          ])
        ])
      );
    });

    view.append(list, el("button", {
      class: "btn btn--ghost", type: "button", text: "Επαναφορά αιτημάτων",
      style: "margin-top:20px",
      onclick() { Store.remove("admin:handled"); render(); }
    }));
  }

  /* ======================================================================
     Καταστήματα & προσφορές
     ====================================================================== */
  function viewShops() {
    view.append(head("Καταστήματα & Προσφορές", "Δίκτυο Χορηγών του Συλλόγου"), kpis());

    const rows = D.OFFERS.map(o => el("tr", {}, [
      el("td", { html: '<span style="font-size:18px;margin-right:8px">' + o.icon + "</span><b>" + o.name + "</b>" }),
      el("td", { text: o.category === "food" ? "Εστίαση" : "Αγορές" }),
      el("td", { text: o.headline }),
      el("td", { text: o.usesTotal + " / μήνα" }),
      el("td", { html: '<span class="badge badge--ok">' + o.discount + "</span>" })
    ]));

    view.append(el("div", { class: "card" }, [
      el("table", { class: "table" }, [
        el("thead", {}, [el("tr", {}, [
          el("th", { text: "Κατάστημα" }), el("th", { text: "Κατηγορία" }),
          el("th", { text: "Προσφορά" }), el("th", { text: "Όριο χρήσεων" }),
          el("th", { text: "Έκπτωση" })
        ])]),
        el("tbody", {}, rows)
      ])
    ]));
  }

  /* ======================================================================
     Αγώνες & κόστος stream
     ====================================================================== */
  function viewMatches() {
    view.append(head("Αγώνες & Κόστος Stream", "Μεταδόσεις Ακαδημιών και Λειτουργικό Κόστος"), kpis());

    const rows = D.ADMIN.matchCosts.map(m => el("tr", {}, [
      el("td", { html: "<b>" + m.match + "</b>" }),
      el("td", { text: m.date }),
      el("td", { text: String(m.viewers) }),
      el("td", { class: "bold", text: fmtEuro(m.cost) })
    ]));

    const totalCost = D.ADMIN.matchCosts.reduce((s, m) => s + m.cost, 0);
    const totalViews = D.ADMIN.matchCosts.reduce((s, m) => s + m.viewers, 0);

    view.append(
      el("div", { class: "card", style: "margin-bottom:24px" }, [
        el("table", { class: "table" }, [
          el("thead", {}, [el("tr", {}, [
            el("th", { text: "Αγώνας" }), el("th", { text: "Ημερομηνία" }),
            el("th", { text: "Θεατές" }), el("th", { text: "Κόστος" })
          ])]),
          el("tbody", {}, rows)
        ])
      ]),
      el("div", { class: "grid-2" }, [
        kpi("ΣΥΝΟΛΙΚΟ ΚΟΣΤΟΣ ΜΕΤΑΔΟΣΕΩΝ", fmtEuro(totalCost), "navy"),
        kpi("ΣΥΝΟΛΙΚΕΣ ΠΡΟΒΟΛΕΣ", String(totalViews), "ok")
      ])
    );
  }

  /* ======================================================================
     Οικονομικές αναφορές
     ====================================================================== */
  function viewReports() {
    const K = D.ADMIN.kpis;
    const streamYear = K.streamCost * 12;
    const revenueYear = K.monthlyRevenue * 12;

    view.append(head("Οικονομικές Αναφορές", "Σύνοψη Μήνα & Έτους"), kpis());

    const bars = [
      { label: "Συνδρομές ενηλίκων", value: 5200 },
      { label: "Συνδρομές ακαδημιών", value: 1180 },
      { label: "Εκδηλώσεις & εισιτήρια", value: 460 }
    ];
    const max = Math.max.apply(null, bars.map(b => b.value));

    const chart = el("div", { class: "card", style: "display:grid;gap:16px" }, [
      el("h3", { class: "card__title", text: "Ανάλυση Εσόδων Μήνα" })
    ]);
    bars.forEach(b => {
      chart.appendChild(el("div", {}, [
        el("div", { class: "between", style: "margin-bottom:6px" }, [
          el("span", { class: "t-sm bold", text: b.label }),
          el("span", { class: "t-sm bold", text: fmtEuro(b.value) })
        ]),
        el("div", { class: "progress", style: "background:var(--paper-200)" }, [
          el("div", { class: "progress__bar", style: "width:" + Math.round((b.value / max) * 100) + "%;background:var(--ion-navy)" })
        ])
      ]));
    });

    view.append(
      chart,
      el("div", { class: "grid-2", style: "margin-top:24px" }, [
        kpi("ΕΤΗΣΙΑ ΕΣΟΔΑ (ΠΡΟΒΟΛΗ)", fmtEuro(revenueYear), "ok"),
        kpi("ΕΤΗΣΙΟ ΚΟΣΤΟΣ STREAM", fmtEuro(streamYear), "navy")
      ]),
      el("p", { class: "t-sm muted", style: "margin-top:20px",
                text: "Τα μεγέθη είναι ενδεικτικά για τους σκοπούς της παρουσίασης." })
    );
  }

  render();
})();
