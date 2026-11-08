"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");

run({
  seeded_message_title_from_id() {
    const { ION } = loadCore();
    const t = ION.chatTitle({ user: "Μάκης", levelId: "ultra", title: "ever_present", text: "x" });
    assert.strictEqual(t.name, "Θρύλος της θύρας");
    assert.strictEqual(t.tier, "gold");
  },
  own_message_uses_chosen_title() {
    const { ION } = loadCore();
    ION.Trophies.setTitle("p_giorgos", "customer");
    const t = ION.chatTitle({ user: "Γιώργος", levelId: "hooligan", profileId: "p_giorgos", text: "x" });
    assert.strictEqual(t.id, "customer");
  },
  no_title_is_null() {
    const { ION } = loadCore();
    assert.strictEqual(ION.chatTitle({ user: "Λάκης", levelId: "touristas", text: "x" }), null);
    assert.strictEqual(ION.chatTitle({ user: "Χ", title: "nope", text: "x" }), null);
  },
  seed_chat_has_titles() {
    const { D } = loadCore();
    const all = [].concat(D.CHAT_SEED.match, D.CHAT_AMBIENT);
    assert.ok(all.filter(m => m.title).length >= 6, "few titled messages");
    all.filter(m => m.title).forEach(m => assert.ok(D.TROPHIES.find(t => t.id === m.title), "bad id " + m.title));
  },
  ambient_chat_is_varied() {
    const { D } = loadCore();
    assert.ok(D.CHAT_AMBIENT.length >= 35, "need at least 35 lines, got " + D.CHAT_AMBIENT.length);
    const users = new Set(D.CHAT_AMBIENT.map(m => m.user));
    assert.ok(users.size >= 20, "need at least 20 different fans, got " + users.size);
    const texts = new Set(D.CHAT_AMBIENT.map(m => m.text));
    assert.strictEqual(texts.size, D.CHAT_AMBIENT.length, "duplicate lines");
  },
  ambient_picker_never_repeats_within_a_round() {
    const { ION, D } = loadCore();
    const next = ION.ambientPicker(D.CHAT_AMBIENT);
    const n = D.CHAT_AMBIENT.length;
    const seen = new Set();
    for (let i = 0; i < n; i++) seen.add(next().text);
    assert.strictEqual(seen.size, n, "a line came back before every line was used");
  },
  ambient_picker_never_same_fan_twice_in_a_row() {
    const { ION, D } = loadCore();
    const next = ION.ambientPicker(D.CHAT_AMBIENT);
    let prev = next();
    for (let i = 0; i < D.CHAT_AMBIENT.length * 5; i++) {
      const m = next();
      assert.notStrictEqual(m.user, prev.user, "same fan twice in a row: " + m.user);
      prev = m;
    }
  }
});
