/* Φορτώνει data.js + core.js σε απομονωμένο vm context με localStorage στη μνήμη. */
"use strict";
const vm = require("vm");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function makeStorage(seed) {
  const map = new Map(Object.entries(seed || {}));
  const api = {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: k => { map.delete(k); },
    key: i => Array.from(map.keys())[i] || null,
    get length() { return map.size; },
    _map: map
  };
  /* Object.keys(localStorage) πρέπει να δίνει τα κλειδιά, όπως στον browser. */
  return new Proxy(api, {
    ownKeys: () => Array.from(map.keys()),
    getOwnPropertyDescriptor: (t, k) => map.has(k)
      ? { enumerable: true, configurable: true, value: map.get(k) }
      : Object.getOwnPropertyDescriptor(t, k)
  });
}

function loadCore(seedStorage) {
  const storage = makeStorage(seedStorage);
  const node = () => ({ style: {}, appendChild() {}, setAttribute() {}, addEventListener() {}, remove() {} });
  const ctx = {
    localStorage: storage,
    document: { createElement: node, createTextNode: node, body: { appendChild() {} } },
    setTimeout, clearTimeout, setInterval, clearInterval, Intl, Date, Math, JSON, console
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ["assets/js/data.js", "assets/js/core.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  }
  return { ION: ctx.ION, D: ctx.ION_DATA, storage: storage._map || storage };
}

/* Μικρός runner: κάθε test με όνομα, τυπώνει ok/FAIL, exit code 1 σε αποτυχία. */
function run(tests) {
  let failed = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { fn(); console.log("ok " + name); }
    catch (e) { failed++; console.log("FAIL " + name + ": " + e.message); }
  }
  if (failed) process.exit(1);
}

module.exports = { loadCore, run };
