"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");

run({
  noise_clamps() {
    const { ION } = loadCore();
    assert.strictEqual(ION.Noise.tap(98), 100);
    assert.strictEqual(ION.Noise.tap(10), 16);
    assert.strictEqual(ION.Noise.crowd(99), 100);
    assert.strictEqual(ION.Noise.crowd(10), 13);
    assert.strictEqual(ION.Noise.decay(1), 0);
    assert.strictEqual(ION.Noise.decay(50), 48);
  },
  noise_labels() {
    const { ION } = loadCore();
    const L = ION.Noise.label;
    assert.strictEqual(L(0), "Ζεσταίνεται");
    assert.strictEqual(L(33), "Ζεσταίνεται");
    assert.strictEqual(L(34), "Ακούγεται");
    assert.strictEqual(L(74), "Ακούγεται");
    assert.strictEqual(L(75), "Σείεται η Νεάπολη");
    assert.strictEqual(L(100), "Σείεται η Νεάπολη");
  },
  reactions_four() {
    const { D } = loadCore();
    assert.deepStrictEqual(Array.from(D.REACTIONS, r => r.id), ["goal", "fire", "heart", "clap"]);
    assert.deepStrictEqual(Array.from(D.REACTIONS, r => r.emoji), ["⚽", "🔥", "💙", "👏"]);
    D.REACTIONS.forEach(r => assert.ok(r.label, "label for " + r.id));
  },
  goal_once() {
    const { ION } = loadCore();
    assert.strictEqual(ION.LiveScore.get(), "2-1");
    assert.strictEqual(ION.LiveScore.goal(), "3-1");
    assert.strictEqual(ION.LiveScore.goal(), "3-1");
    assert.strictEqual(ION.LiveScore.get(), "3-1");
    assert.strictEqual(ION.LiveScore.scored(), true);
  },
  goal_replay_suppressed() {
    const { ION } = loadCore();
    ION.Store.set("live:score", "3-1");
    let appended = 0;
    const player = { appendChild() { appended++; } };
    const calls = [];
    const h = ION.liveHype(player, s => calls.push(s));
    appended = 0;
    h.goal();
    h.stop();
    assert.deepStrictEqual(calls, ["3-1"]);
    assert.strictEqual(appended, 0, "banner or emoji replayed");
  },
  score_reset() {
    const { ION } = loadCore();
    ION.LiveScore.goal();
    ION.LiveScore.reset();
    assert.strictEqual(ION.LiveScore.get(), "2-1");
    assert.strictEqual(ION.LiveScore.scored(), false);
  }
});
