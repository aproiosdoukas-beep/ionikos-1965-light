"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");

const ids = list => Array.from(list, t => t.id);
const find = (ION, pid, id) => ION.Trophies.forProfile(pid).find(t => t.id === id);

run({
  twelve_trophies_four_tiers() {
    const { D } = loadCore();
    assert.strictEqual(D.TROPHIES.length, 13);
    for (const t of D.TROPHIES) assert.ok(D.TIERS[t.tier], "unknown tier " + t.tier);
    assert.strictEqual(D.TROPHIES.find(t => t.id === "stand_voice").name, "Ο Κάπο");
  },

  seed_progress() {
    const { ION } = loadCore();
    assert.strictEqual(find(ION, "p_giorgos", "stand_voice").progress, 24);
    assert.strictEqual(find(ION, "p_giorgos", "customer").unlocked, true);
    assert.strictEqual(find(ION, "p_giorgos", "present").progress, 9);
    assert.strictEqual(find(ION, "p_giorgos", "loyal_customer").progress, 3);
  },

  chat_unlocks_stand_voice_once() {
    const { ION } = loadCore();
    assert.deepStrictEqual(ids(ION.Trophies.record("p_giorgos", "chat")), ["stand_voice"]);
    assert.deepStrictEqual(ids(ION.Trophies.record("p_giorgos", "chat")), []);
  },

  redeem_burgers_unlocks_loyal_customer() {
    const { ION } = loadCore();
    assert.ok(ids(ION.Trophies.record("p_giorgos", "redeem", "m_burgers")).includes("loyal_customer"));
    ION.Trophies.record("p_giorgos", "redeem", "m_burgers");
    assert.strictEqual(find(ION, "p_giorgos", "loyal_customer").progress, 4);
  },

  gate_unlocks_present() {
    const { ION } = loadCore();
    assert.deepStrictEqual(ids(ION.Trophies.record("p_giorgos", "gate")), ["present"]);
  },

  title_only_if_unlocked() {
    const { ION } = loadCore();
    const T = ION.Trophies;
    assert.strictEqual(T.setTitle("p_giorgos", "ever_present"), false);
    assert.strictEqual(T.title("p_giorgos"), null);
    assert.strictEqual(T.setTitle("p_giorgos", "customer"), true);
    assert.strictEqual(T.title("p_giorgos").id, "customer");
    assert.strictEqual(T.setTitle("p_giorgos", "nope"), false);
    assert.strictEqual(T.title("p_giorgos").id, "customer");
    assert.strictEqual(T.setTitle("p_giorgos", null), true);
    assert.strictEqual(T.title("p_giorgos"), null);
  },

  platinum_counts_others() {
    const { ION } = loadCore();
    const p = find(ION, "p_giorgos", "since_1965");
    assert.strictEqual(p.goal, 12);
    const unlockedOthers = ION.Trophies.forProfile("p_giorgos").filter(t => t.id !== "since_1965" && t.unlocked).length;
    assert.strictEqual(p.progress, unlockedOthers);
  },

  months_from_membership() {
    const { ION } = loadCore();
    assert.strictEqual(find(ION, "p_giorgos", "loyal").progress, 8);
    assert.strictEqual(find(ION, "p_maria", "loyal").progress, 4);
  },

  summary_counts_tiers() {
    const { ION } = loadCore();
    ION.Trophies.record("p_giorgos", "chat");
    const s = ION.Trophies.summary("p_giorgos");
    assert.strictEqual(s.total, 13);
    assert.strictEqual(s.silver >= 1, true);
    assert.strictEqual(s.unlocked, s.bronze + s.silver + s.gold + s.platinum);
  },

  reset_clears_progress_keeps_session() {
    const { ION } = loadCore();
    ION.Auth.login("giorgos@ionikos.gr", "ionikos1965");
    ION.Trophies.record("p_giorgos", "chat");
    ION.Trophies.setTitle("p_giorgos", "customer");
    ION.Trophies.reset();
    assert.strictEqual(find(ION, "p_giorgos", "stand_voice").progress, 24);
    assert.strictEqual(ION.Trophies.title("p_giorgos"), null);
    assert.ok(ION.Auth.account(), "logged out by reset");
  },

  profiles_are_separate() {
    const { ION } = loadCore();
    assert.deepStrictEqual(ids(ION.Trophies.record("p_maria", "chat")), ["first_voice"]);
    assert.strictEqual(find(ION, "p_kostis", "first_voice").unlocked, false);
  }
});
