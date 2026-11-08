"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");

run({
  all_twelve_tables() {
    const { D } = loadCore();
    const S = D.STANDINGS;
    assert.strictEqual(S.sports.length, 3);
    assert.strictEqual(S.groups.length, 4);
    for (const sp of S.sports) for (const g of S.groups) {
      assert.ok(S.tables[sp.id + ":" + g.id], "missing " + sp.id + ":" + g.id);
    }
  },

  rows_consistent() {
    const { D } = loadCore();
    const S = D.STANDINGS;
    for (const sp of S.sports) for (const g of S.groups) {
      const key = sp.id + ":" + g.id;
      const t = S.tables[key];
      assert.ok(t.competition, key + " no competition");
      assert.ok(t.rows.length >= 6 && t.rows.length <= 8, key + " rows " + t.rows.length);
      t.rows.forEach((r, i) => {
        assert.strictEqual(r.p, r.w + r.d + r.l, key + " p mismatch " + r.team);
        if (!sp.draws) assert.strictEqual(r.d, 0, key + " draw in " + sp.id);
        if (sp.id === "football") assert.strictEqual(r.pts, 3 * r.w + r.d, key + " pts " + r.team);
        if (i) assert.ok(t.rows[i - 1].pts >= r.pts, key + " not sorted");
      });
      for (const f of ["home", "away", "score", "date"]) assert.ok(t.last[f], key + " last." + f);
      for (const f of ["home", "away", "date", "time", "venue"]) assert.ok(t.next[f], key + " next." + f);
    }
  },

  one_ionikos_row() {
    const { D } = loadCore();
    for (const [key, t] of Object.entries(D.STANDINGS.tables)) {
      assert.strictEqual(t.rows.filter(r => r.team.indexOf("Ιωνικός") === 0).length, 1, key);
    }
  }
});
