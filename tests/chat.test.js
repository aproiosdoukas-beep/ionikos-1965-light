"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");

run({
  seeded_message_title_from_id() {
    const { ION } = loadCore();
    const t = ION.chatTitle({ user: "Μάκης", levelId: "ultra", title: "ever_present", text: "x" });
    assert.strictEqual(t.name, "Θρύλος της Θύρας");
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
  }
});
