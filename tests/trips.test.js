"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");

run({
  trip_seed() {
    const { D } = loadCore();
    const t = D.AWAY_TRIP;
    assert.deepStrictEqual([t.seats, t.taken, t.meet], [50, 37, "Πλατεία Νίκαιας"]);
  },
  join_records_away_once() {
    const { ION } = loadCore();
    const first = ION.Trips.join("p_giorgos");
    assert.strictEqual(first.ok, true);
    assert.ok(Array.from(first.unlocked, t => t.id).includes("traveler"));
    assert.deepStrictEqual(Object.assign({}, ION.Trips.state("p_giorgos")), { joined: true, taken: 38, left: 12 });
    assert.strictEqual(ION.Trips.cancel("p_giorgos"), true);
    const again = ION.Trips.join("p_giorgos");
    assert.strictEqual(again.ok, true);
    assert.strictEqual(again.unlocked.length, 0);
    assert.strictEqual(ION.Store.get("trophies:p_giorgos").counts.away, 3);
  },
  join_twice_refused() {
    const { ION } = loadCore();
    ION.Trips.join("p_giorgos");
    assert.strictEqual(ION.Trips.join("p_giorgos").ok, false);
  },
  full_bus_refuses() {
    const { ION, D } = loadCore();
    D.AWAY_TRIP.taken = 50;
    const r = ION.Trips.join("p_maria");
    assert.strictEqual(r.ok, false);
    assert.strictEqual(ION.Trips.state("p_maria").left, 0);
  },
  reset_clears_trips() {
    const { ION } = loadCore();
    ION.Trips.join("p_maria");
    ION.Trips.reset();
    assert.strictEqual(ION.Trips.state("p_maria").joined, false);
  },
  cancel_frees_seat() {
    const { ION } = loadCore();
    ION.Trips.join("p_maria");
    ION.Trips.cancel("p_maria");
    assert.deepStrictEqual(Object.assign({}, ION.Trips.state("p_maria")), { joined: false, taken: 37, left: 13 });
    assert.strictEqual(ION.Trips.cancel("p_maria"), false);
  }
});
