"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");
const M = "match_k16";

run({
  oracle_trophy_defined() {
    const { D } = loadCore();
    const t = D.TROPHIES.find(x => x.id === "oracle");
    assert.ok(t, "no oracle");
    assert.deepStrictEqual([t.name, t.tier, t.action, t.goal], ["Ο Μάντης", "bronze", "predict_hit", 1]);
  },
  lock_once() {
    const { ION } = loadCore();
    assert.strictEqual(ION.Predictions.lock("p_giorgos", M, 3, 1), true);
    assert.strictEqual(ION.Predictions.lock("p_giorgos", M, 0, 0), false);
    const p = ION.Predictions.get("p_giorgos", M);
    assert.deepStrictEqual([p.home, p.away, p.result], [3, 1, null]);
  },
  lock_rejects_out_of_range() {
    const { ION } = loadCore();
    assert.strictEqual(ION.Predictions.lock("p_giorgos", M, 10, 1), false);
    assert.strictEqual(ION.Predictions.lock("p_giorgos", M, -1, 1), false);
    assert.strictEqual(ION.Predictions.lock("p_giorgos", M, 1.5, 1), false);
    assert.strictEqual(ION.Predictions.get("p_giorgos", M), null);
  },
  settle_exact_unlocks_oracle() {
    const { ION } = loadCore();
    ION.Predictions.lock("p_giorgos", M, 3, 1);
    const r = ION.Predictions.settle("p_giorgos", M, "3-1");
    assert.strictEqual(r.result, "exact");
    assert.ok(Array.from(r.unlocked, t => t.id).includes("oracle"));
  },
  settle_outcome_no_trophy() {
    const { ION } = loadCore();
    ION.Predictions.lock("p_giorgos", M, 2, 0);
    const r = ION.Predictions.settle("p_giorgos", M, "3-1");
    assert.strictEqual(r.result, "outcome");
    assert.strictEqual(r.unlocked.length, 0);
    const st = JSON.parse(loadCoreStateKey(ION, "p_giorgos"));
    assert.strictEqual(st.counts.predict_outcome, 1);
  },
  settle_miss() {
    const { ION } = loadCore();
    ION.Predictions.lock("p_giorgos", M, 0, 2);
    assert.strictEqual(ION.Predictions.settle("p_giorgos", M, "3-1").result, "miss");
  },
  settle_twice_records_once() {
    const { ION } = loadCore();
    ION.Predictions.lock("p_giorgos", M, 3, 1);
    ION.Predictions.settle("p_giorgos", M, "3-1");
    const again = ION.Predictions.settle("p_giorgos", M, "3-1");
    assert.strictEqual(again.result, "exact");
    assert.strictEqual(again.unlocked.length, 0);
    const st = JSON.parse(loadCoreStateKey(ION, "p_giorgos"));
    assert.strictEqual(st.counts.predict_hit, 1);
  },
  reset_clears_predictions() {
    const { ION } = loadCore();
    ION.Predictions.lock("p_giorgos", M, 3, 1);
    ION.Predictions.reset();
    assert.strictEqual(ION.Predictions.get("p_giorgos", M), null);
  },
  settle_without_lock_null() {
    const { ION } = loadCore();
    assert.strictEqual(ION.Predictions.settle("p_giorgos", M, "3-1"), null);
  }
});

function loadCoreStateKey(ION, pid) {
  return JSON.stringify(ION.Store.get("trophies:" + pid, null));
}
