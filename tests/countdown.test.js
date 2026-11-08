"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");
const at = (y, m, d, hh, mm) => new Date(y, m - 1, d, hh, mm).getTime();

run({
  picks_earliest_future() {
    const { ION } = loadCore();
    const a = ION.nextHomeGame(at(2026, 11, 8, 12, 0));
    assert.deepStrictEqual([a.leagueId, a.opponent, a.date, a.time], ["football", "Αμφιάλη", "08/11/2026", "18:00"]);
    assert.strictEqual(a.at, at(2026, 11, 8, 18, 0));
    const b = ION.nextHomeGame(at(2026, 11, 8, 19, 0));
    assert.deepStrictEqual([b.leagueId, b.opponent, b.date], ["volleyball", "Αργυρούπολη Ελληνικού", "14/11/2026"]);
  },
  none_when_all_past() {
    const { ION } = loadCore();
    assert.strictEqual(ION.nextHomeGame(at(2027, 1, 1, 0, 0)), null);
  },
  parts_never_negative() {
    const { ION } = loadCore();
    assert.deepStrictEqual(Object.assign({}, ION.countdownParts(-5000)), { days: 0, hours: 0, minutes: 0 });
    assert.deepStrictEqual(Object.assign({}, ION.countdownParts(((2 * 24 + 3) * 60 + 4) * 60000 + 59000)), { days: 2, hours: 3, minutes: 4 });
  },
  countdown_card_builds() {
    const { ION } = loadCore();
    assert.doesNotThrow(() => ION.countdownCard("p_giorgos"));
    assert.doesNotThrow(() => ION.countdownCard(null, "login.html"));
  },
  rsvp_toggle_counts() {
    const { ION } = loadCore();
    const k = "football:08/11/2026";
    assert.strictEqual(ION.Rsvp.count(k), 412);
    assert.strictEqual(ION.Rsvp.toggle(k, "p_giorgos"), true);
    assert.strictEqual(ION.Rsvp.mine(k, "p_giorgos"), true);
    assert.strictEqual(ION.Rsvp.count(k), 413);
    assert.strictEqual(ION.Rsvp.toggle(k, "p_giorgos"), false);
    assert.strictEqual(ION.Rsvp.count(k), 412);
  }
});
