"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");

const leagues = D => D.STANDINGS.leagues;

run({
  three_real_leagues() {
    const { D } = loadCore();
    assert.deepStrictEqual(Array.from(leagues(D), l => l.id), ["football", "basketball", "volleyball"]);
    for (const l of leagues(D)) {
      assert.ok(l.label && l.team && l.competition, l.id + " labels");
      assert.ok(/^https:\/\//.test(l.liveUrl), l.id + " liveUrl");
      assert.ok(l.source && /^https:\/\//.test(l.source.url) && l.source.name && l.source.date, l.id + " source");
    }
  },

  football_table_is_real_and_consistent() {
    const { D } = loadCore();
    const f = leagues(D).find(l => l.id === "football");
    assert.strictEqual(f.competition, "Γ΄ Εθνική, 8ος όμιλος");
    assert.strictEqual(f.rows.length, 12);
    f.rows.forEach((r, i) => {
      assert.strictEqual(r.p, r.w + r.d + r.l, r.team);
      assert.strictEqual(r.pts, 3 * r.w + r.d, r.team);
      if (i) assert.ok(f.rows[i - 1].pts >= r.pts, "sorted");
    });
    const us = f.rows.find(r => r.us);
    assert.deepStrictEqual([us.team, us.pts], ["Ιωνικός", 4]);
    assert.strictEqual(f.last.score, "2-0");
    assert.strictEqual(f.next.away, "Αμφιάλη");
  },

  volleyball_table_is_real() {
    const { D } = loadCore();
    const v = leagues(D).find(l => l.id === "volleyball");
    assert.strictEqual(v.rows.length, 12);
    v.rows.forEach(r => { assert.strictEqual(r.p, r.w + r.l, r.team); assert.strictEqual(r.d, 0); });
    assert.strictEqual(v.rows[11].team, "Α.Ο. Ιωνικός Νίκαιας");
    assert.strictEqual(v.rows[11].us, true);
    assert.strictEqual(v.next.date, "14/11/2026");
  },

  basketball_has_no_invented_table() {
    const { D } = loadCore();
    const b = leagues(D).find(l => l.id === "basketball");
    assert.strictEqual(b.rows, null);
    assert.ok(b.note, "needs a note explaining why");
  },

  exactly_one_us_row() {
    const { D } = loadCore();
    for (const l of leagues(D)) if (l.rows) assert.strictEqual(l.rows.filter(r => r.us).length, 1, l.id);
  }
});
