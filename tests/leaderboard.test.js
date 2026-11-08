"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");

run({
  fans_seed_valid() {
    const { D } = loadCore();
    assert.strictEqual(D.FANS.length, 12);
    D.FANS.forEach(f => {
      assert.ok(f.points >= 20 && f.points <= 260, f.name);
      assert.ok(D.TROPHIES.find(t => t.id === f.title), "title " + f.title);
      assert.ok(D.LEVELS.find(l => l.id === f.levelId), "level " + f.levelId);
    });
  },
  points_from_counts() {
    const { ION } = loadCore();
    assert.strictEqual(ION.Leaderboard.points("p_giorgos"), 24 + 9 * 5 + 2 * 5);
    ION.Trophies.record("p_giorgos", "predict_hit");
    ION.Trophies.record("p_giorgos", "predict_outcome");
    ION.Trophies.record("p_giorgos", "ticket");
    assert.strictEqual(ION.Leaderboard.points("p_giorgos"), 79 + 10 + 3 + 2);
  },
  rows_sorted_top10() {
    const { ION } = loadCore();
    const rows = Array.from(ION.Leaderboard.rows("p_giorgos"));
    assert.ok(rows.length <= 11);
    rows.slice(0, 10).forEach((r, i) => {
      assert.strictEqual(r.rank, i + 1);
      if (i) assert.ok(rows[i - 1].points >= r.points, "sorted");
    });
    assert.strictEqual(rows.filter(r => r.you).length, 1);
  },
  you_appended_when_outside() {
    const { ION } = loadCore();
    const rows = Array.from(ION.Leaderboard.rows("p_kostis"));
    assert.strictEqual(rows.length, 11);
    const me = rows[10];
    assert.strictEqual(me.you, true);
    assert.strictEqual(me.rank, 13);
    assert.strictEqual(me.name, "Κωστής Παπαδόπουλος");
  },
  you_inside_not_duplicated() {
    const { ION } = loadCore();
    for (let i = 0; i < 300; i++) ION.Trophies.record("p_giorgos", "chat");
    const rows = Array.from(ION.Leaderboard.rows("p_giorgos"));
    assert.strictEqual(rows.length, 10);
    assert.strictEqual(rows[0].you, true);
    assert.strictEqual(rows[0].rank, 1);
  }
});
