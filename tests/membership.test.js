"use strict";
const assert = require("assert");
const { loadCore, run } = require("./harness");

const GIORGOS = ["giorgos@ionikos.gr", "ionikos1965"];
const MARIA = ["maria@ionikos.gr", "ionikos1965"];

run({
  maria_account_exists() {
    const { D } = loadCore();
    const acc = D.ACCOUNTS.find(a => a.email === "maria@ionikos.gr");
    assert.ok(acc, "no maria account");
    assert.strictEqual(acc.password, "ionikos1965");
    assert.strictEqual(acc.role, "member");
    assert.deepStrictEqual(Array.from(acc.profiles), ["p_maria"]);
    const p = D.PROFILES.p_maria;
    assert.strictEqual(p.cardCode, "ION-2190");
    assert.strictEqual(p.levelId, "casual");
    assert.strictEqual(p.monthsMember, 4);
    assert.strictEqual(p.kind, "adult");
    assert.strictEqual(p.kindLabel, "Μέλος");
  },

  login_maria_gets_own_subscription() {
    const { ION } = loadCore();
    assert.ok(ION.Auth.login(...MARIA).ok);
    assert.deepStrictEqual(Array.from(ION.Auth.profiles(), p => p.id), ["p_maria"]);
    assert.strictEqual(ION.Membership.totals().perMonth, 20);
  },

  accounts_are_isolated() {
    const { ION } = loadCore();
    ION.Auth.login(...MARIA);
    ION.Membership.cancel();
    ION.Auth.logout();
    ION.Auth.login(...GIORGOS);
    assert.strictEqual(ION.Membership.get().status, "active");
    assert.strictEqual(ION.Membership.members().length, 2);
  },

  legacy_key_migrates_to_giorgos() {
    const first = loadCore();
    first.ION.Auth.login(...GIORGOS);
    const legacy = first.ION.Membership.get();
    legacy.status = "cancelled";
    legacy.cycle = "yearly";
    const { ION, storage } = loadCore({ "ion1965:membership": JSON.stringify(legacy) });
    ION.Auth.login(...GIORGOS);
    const m = ION.Membership.get();
    assert.strictEqual(m.status, "cancelled");
    assert.strictEqual(m.cycle, "yearly");
    assert.ok(storage.has("ion1965:membership:u_giorgos"), "no per-account key");
    assert.ok(!storage.has("ion1965:membership"), "legacy key still there");
  },

  scanner_finds_cards_across_accounts() {
    const { ION } = loadCore();
    ION.Auth.login(...MARIA);
    const k = ION.resolveCard("ION-5513");
    assert.strictEqual(k.state, "valid");
    assert.strictEqual(k.profileId, "p_kostis");
    assert.strictEqual(ION.resolveCard("ION-2190").profileId, "p_maria");
  },

  paused_account_card_is_expired() {
    const { ION } = loadCore();
    ION.Auth.login(...GIORGOS);
    ION.Membership.cancel();
    ION.Auth.logout();
    assert.strictEqual(ION.resolveCard("ION-8472").state, "expired");
    assert.strictEqual(ION.resolveCard("ION-2190").state, "valid");
  },

  removed_seed_card_does_not_open() {
    const { ION } = loadCore();
    ION.Auth.login(...GIORGOS);
    const res = ION.Membership.removeMember("p_kostis");
    assert.ok(res.ok, "remove failed");
    ION.Auth.logout();
    assert.strictEqual(ION.resolveCard("ION-5513"), null);
  }
});
