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
  no_disputed_items() {
    const { D } = loadCore();
    const all = JSON.stringify(D.HISTORY);
    for (const bad of ["Κύπελλο Πειραιά", "Μεγάλη Δευτέρα", "Δευτέρα του Πάσχα"]) assert.ok(!all.includes(bad), bad);
  }
});
