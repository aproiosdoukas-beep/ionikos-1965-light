"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");

run({
  timeline_chronological() {
    const { D } = loadCore();
    const years = D.HISTORY.timeline.map(t => Number(String(t.year).slice(0, 4)));
    assert.ok(years.length >= 10, "too short");
    years.forEach((y, i) => { if (i) assert.ok(years[i - 1] <= y, "order at " + i); });
  },
  every_item_sourced() {
    const { D } = loadCore();
    const ids = D.HISTORY.sources.map(s => s.id);
    D.HISTORY.sources.forEach(s => assert.ok(/^https:\/\//.test(s.url), s.id));
    D.HISTORY.timeline.forEach(t => {
      assert.ok(ids.includes(t.source), "unsourced: " + t.year);
      assert.ok(["football", "basketball", "club"].includes(t.sport), "sport " + t.year);
    });
  },
  founding_fact() {
    const { D } = loadCore();
    assert.ok(D.HISTORY.facts.some(f => f.value.includes("29 Ιουνίου 1965")));
    assert.ok(D.HISTORY.facts.some(f => f.value.includes("μπλε και λευκό")));
  },
  claims_match_sources() {
    const { D } = loadCore();
    const by = y => D.HISTORY.timeline.find(t => t.year === y);
    assert.ok(by("2024-25").text.includes("όμιλ"), "2024-25 must say first in its group");
    assert.ok(!by("2024-25").text.includes("Πρωτάθλημα"), "2024-25 is not a championship");
    assert.ok(!by("1983-84").text.includes("του συλλόγου"), "73 points: source says ρεκόρ only");
    assert.strictEqual(by("2000").source, "el_club", "5.000 fans figure is on the club page");
  },
  no_disputed_items() {
    const { D } = loadCore();
    const all = JSON.stringify(D.HISTORY);
    for (const bad of ["Κύπελλο Πειραιά", "Μεγάλη Δευτέρα", "Δευτέρα του Πάσχα"]) assert.ok(!all.includes(bad), bad);
  }
});
