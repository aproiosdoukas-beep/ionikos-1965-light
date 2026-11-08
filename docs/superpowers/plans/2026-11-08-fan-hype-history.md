# Δεύτερος γύρος (αντιδράσεις, πρόβλεψη, κατάταξη, εκδρομή, αντίστροφη μέτρηση, ιστορία): Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add live reactions with a noise meter and demo goal, score prediction with the «Ο Μάντης» trophy, a fan leaderboard, an away-trip bus sign-up, a next-home-game countdown with RSVP, and a club history page.

**Architecture:** Same as round 1: data in `assets/js/data.js`, pure logic stores in `assets/js/core.js` (new `Noise`, `Predictions`, `Leaderboard`, `Trips`, `Rsvp`, `nextHomeGame`), views in `app.js` / `web.js` / `index.html`. Logic is unit-tested with the existing Node harness (`tests/harness.js`, `sh tests/run.sh`); UI is verified in the built-in browser.

**Tech Stack:** Vanilla JS, CSS custom properties, Node `vm` + `assert`.

**Spec:** `docs/superpowers/specs/2026-11-08-fan-hype-history-design.md`

## Global Constraints

- Natural Greek, sentence case for names; all-caps Greek only via `upper()`; no em dash, en dash or minus glyphs; no deck screen numbers; one club.
- One `.btn` system; reuse `.card`, `.card--rule`, `.card--ink`, `.chip`, `.segmented`, `.progress`, `.badge`, `.section-title`, `.eyebrow`, `.empty`.
- Invented data carries the badge «Δεδομένα επίδειξης».
- No backend; all state via `Store`. Existing flows unchanged: QR 60s, scanner 4 outcomes, till, subscription edits, trophies, standings, pinned live video.
- Motion: floating reactions and the goal banner respect `prefers-reduced-motion` (tokens.css already shortens durations).
- Commits in Greek ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; bump `?v=` before publishing.

## Review Focus

1. Leaving and reopening the live page must not fire the demo goal twice in the same visit, and app and web must show the same score (`live:score`). Test in Task 1 (`Noise`/score helpers) and browser check.
2. A prediction cannot be changed after locking, and settling twice must not record `predict_hit` twice. Test in Task 2.
3. Joining, cancelling and re-joining the same trip must count `away` only once. Test in Task 4.
4. A countdown when every known fixture is in the past must show the fallback, not a negative time. Test in Task 5.
5. History entries must stay in chronological order and each carry a source. Test in Task 6.

---

### Task 1: Reactions, noise meter, demo goal

**Files:** Create `tests/live.test.js`. Modify `assets/js/data.js` (`REACTIONS`), `assets/js/core.js` (`Noise`, `LiveScore`), `assets/js/web.js` (`viewLive`), `assets/js/app.js` (`viewLive`), `assets/css/app.css` (`.reactions`, `.reaction`, `.float-emoji`, `.noise`, `.goal-banner`).

**Interfaces (produces):**
- `D.REACTIONS = [{id:"goal",emoji:"⚽",label:"Γκολ"},{id:"fire",emoji:"🔥",label:"Φωτιά"},{id:"heart",emoji:"💙",label:"Μπλε καρδιά"},{id:"clap",emoji:"👏",label:"Χειροκρότημα"}]`.
- `Noise.create() -> { level }`, `Noise.tap(n) -> n` (+6), `Noise.crowd(n) -> n` (+3), `Noise.decay(n) -> n` (-2), all clamped 0..100 (pure, take and return numbers). `Noise.label(level)`: `<34` «Ζεσταίνεται», `<75` «Δυνατά», else «Η κερκίδα σείεται».
- `LiveScore.get() -> "2-1"` (default `D.LIVE.score`), `LiveScore.goal() -> "3-1"` sets `live:score` once and returns the new score; a second call returns the same score unchanged. `LiveScore.reset()`.

- [ ] **Step 1: Failing tests** `tests/live.test.js`: `noise_clamps` (tap from 98 gives 100, decay from 1 gives 0), `noise_labels` (0, 33, 34, 74, 75, 100), `reactions_four` (ids and emoji), `goal_once` (`get()` "2-1", `goal()` "3-1", `goal()` again "3-1", `get()` "3-1"), `score_reset`.
- [ ] **Step 2: Run** `sh tests/run.sh` → FAIL on `noise_clamps`.
- [ ] **Step 3: Implement** data and core.
- [ ] **Step 4: Run** → `ALL PASS`.
- [ ] **Step 5: UI** (web + app Live): reaction row under the player; tap → `.float-emoji` absolutely positioned in the player, random x 15..85%, removed on `animationend`; meter bar with label; timers: crowd every 800 ms, decay every 400 ms, demo goal `setTimeout` 45 s after view render only if `LiveScore.get() === D.LIVE.score`; goal shows `.goal-banner` with `upper("Γκολ του Ιωνικού")` for 3 s and updates the scoreline. All timers registered in each view's cleanup.
- [ ] **Step 6: Browser verify**: taps raise the meter and float emoji; meter decays; forcing the goal (call the same handler) updates score in web and, after navigating, in app; no console errors; 375px no overflow.
- [ ] **Step 7: Commit** («Αντιδράσεις στο live, μετρητής θορύβου και γκολ επίδειξης»).

### Task 2: Score prediction and «Ο Μάντης»

**Files:** Create `tests/predictions.test.js`. Modify `data.js` (add trophy `oracle`; `since_1965.goal` 12), `core.js` (`Predictions`), `web.js` + `app.js` (prediction card in Live), `app.css` (`.predict`, `.stepper`), `tests/trophies.test.js` (13 trophies, platinum goal 12).

**Interfaces:**
- Consumes: `Trophies.record` (round 1), `LiveScore.get()` (Task 1).
- Produces: trophy `{ id:"oracle", name:"Ο Μάντης", tier:"bronze", icon:"check", action:"predict_hit", goal:1, text:"Βρήκατε το ακριβές σκορ ενός αγώνα." }`.
- `Predictions.lock(pid, matchId, home, away) -> boolean` (false if already locked or values outside 0..9), `Predictions.get(pid, matchId) -> {home, away, lockedAt, result|null} | null`, `Predictions.settle(pid, matchId, "3-1") -> { result: "exact"|"outcome"|"miss", unlocked: Trophy[] } | null` (null if not locked; second call returns the stored result with `unlocked: []` and records nothing). Exact records `predict_hit`; outcome-only records `predict_outcome`.

- [ ] **Step 1: Failing tests**: `thirteen_trophies` (update existing test: length 13, `since_1965.goal === 12`), `lock_once`, `lock_rejects_out_of_range`, `settle_exact_unlocks_oracle`, `settle_outcome_no_trophy` (2-0 vs 3-1 → "outcome", counts.predict_outcome 1), `settle_miss`, `settle_twice_records_once`, `settle_without_lock_null`.
- [ ] **Step 2: Run** → FAIL on `thirteen_trophies`.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → `ALL PASS`.
- [ ] **Step 5: UI**: card «Πρόβλεψη»: two steppers built from `.btn--icon` buttons using `icon("plus")` and a new `minus` icon added to `assets/js/icons.js` (aria-labels «Ένα γκολ λιγότερο» / «Ένα γκολ περισσότερο»), «Κλείδωμα πρόβλεψης»; locked state shows the pick; «Λήξη αγώνα (επίδειξη)» settles against `LiveScore.get()` and shows «Ακριβές σκορ! +10 πόντοι» / «Βρήκατε το σημείο, +3 πόντοι» / «Άλλη φορά», with `celebrate(unlocked)`.
- [ ] **Step 6: Browser verify**: lock 3-1, force goal, settle → «Ο Μάντης» toast; reload keeps the locked/settled state; app and web show the same prediction.
- [ ] **Step 7: Commit** («Πρόβλεψη σκορ και τρόπαιο Ο Μάντης»).

### Task 3: Fan leaderboard and «Κερκίδα» page

**Files:** Create `tests/leaderboard.test.js`. Modify `data.js` (`FANS`), `core.js` (`Leaderboard`), `web.js` (route `stand` «Κερκίδα» after «Βαθμολογίες», `viewStand`), `app.js` (card in Level tab), `app.css` (`.leaderboard`).

**Interfaces:**
- `D.FANS`: 12 rows `{ name, levelId, title, points }`, points between 20 and 260, titles valid trophy ids.
- `Leaderboard.points(pid) -> number` = chat×1 + gate×5 + away×5 + predict_hit×10 + predict_outcome×3 + ticket×2 from the trophy counts.
- `Leaderboard.rows(pid) -> Array<{rank, name, levelId, title, points, you}>`: all fans plus you, sorted by points desc (ties: you after fans), top 10, plus your row appended when your rank > 10.

- [ ] **Step 1: Failing tests**: `points_from_counts` (Γιώργος seed: chat 24 + gate 9×5 + away 2×5 = 79), `rows_sorted_top10`, `you_appended_when_outside` (Κωστής with 0 points → 11 rows, last `you` with rank 13), `you_inside_not_duplicated`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → `ALL PASS`.
- [ ] **Step 5: UI**: `web.html#stand`: `head("Κερκίδα", "Η κατάταξη της εβδομάδας")`, `.card.card--rule` table (θέση, όνομα στο χρώμα επιπέδου, τίτλος με `.tier-dot`, πόντοι), your row `.is-you`, badge «Δεδομένα επίδειξης»; slots for the trip card (Task 4) and countdown card (Task 5). App Level tab: card «Κατάταξη εβδομάδας» with top 5 + your row, link «Όλη η κατάταξη» → `web.html#stand`.
- [ ] **Step 6: Browser verify** desktop and 375px; sending a chat message raises your points by 1 after re-render.
- [ ] **Step 7: Commit** («Κατάταξη φιλάθλων και σελίδα Κερκίδα»).

### Task 4: Away trip bus

**Files:** Create `tests/trips.test.js`. Modify `data.js` (`AWAY_TRIP`), `core.js` (`Trips`), `web.js` (card in `viewStand`), `app.js` (card in Card tab), `app.css` (`.bus`, `.bus__seat`).

**Interfaces:**
- `D.AWAY_TRIP = { id:"trip_rhodes", title:"Λεωφορείο οπαδών", match:"Διαγόρας - Ιωνικός", destination:"Ρόδος (με πλοίο από τον Πειραιά)", date:"29/11/2026", time:"07:30", meet:"Πλατεία Νίκαιας", seats:50, taken:37, price:15 }`.
- `Trips.state(pid) -> { joined:boolean, taken:number, left:number }` (taken = seed + 1 if joined), `Trips.join(pid) -> { ok, unlocked: Trophy[] }` (records `away` only the first time ever for this trip and profile; `ok:false` when full or already joined), `Trips.cancel(pid) -> boolean`.

- [ ] **Step 1: Failing tests**: `join_records_away_once` (Γιώργος join → unlocks `traveler`; cancel; join again → `unlocked` empty, counts.away 3), `full_bus_refuses` (seed taken 50 via test override of `D.AWAY_TRIP.taken`), `cancel_frees_seat`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Storage `trip:<tripId>:<pid>` `{ joined, everJoined }`.
- [ ] **Step 4: Run** → `ALL PASS`.
- [ ] **Step 5: UI** card «Πάμε εκτός έδρας»: match, destination, date/time, meeting point, price, bus grid 5 columns × 10 rows (aisle gap after column 2) with taken seats gold, «Έχουν μείνει X θέσεις», «Κλείνω θέση» / «Ακύρωση θέσης», full state «Το λεωφορείο γέμισε», badge «Δεδομένα επίδειξης».
- [ ] **Step 6: Browser verify**: Γιώργος books → «Ο Νομάδας» toast, seat count drops, cancel restores, re-book no toast; 375px fits.
- [ ] **Step 7: Commit** («Εκδρομή εκτός έδρας με λεωφορείο»).

### Task 5: Next home game countdown and RSVP

**Files:** Create `tests/countdown.test.js`. Modify `core.js` (`nextHomeGame`, `Rsvp`), `index.html` (load `data.js` + `core.js`, countdown in hero), `web.js` (card in `viewStand`), `app.js` (Card tab), `assets/css/components.css` (`.countdown`).

**Interfaces:**
- `nextHomeGame(nowMs) -> { key, leagueId, label, team, opponent, date, time, at } | null`: from `D.STANDINGS.leagues[].next` where `home` starts with «Ιωνικός», parsing `dd/mm/yyyy` + `HH:MM` as Europe/Athens local time (use `new Date(y, m-1, d, hh, mm)`), keeping only `at > nowMs`, earliest first.
- `Rsvp.count(key) -> number` (412 + 1 if you said yes), `Rsvp.toggle(key, pid) -> boolean` (new state), `Rsvp.mine(key, pid) -> boolean`.

- [ ] **Step 1: Failing tests**: `picks_earliest_future` (now = 08/11/2026 12:00 → football 08/11 18:00; now = 08/11/2026 19:00 → volleyball 14/11 18:00), `none_when_all_past` (now = 2027-01-01 → null), `rsvp_toggle_counts`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → `ALL PASS`.
- [ ] **Step 5: UI** `.countdown` card: sport and team label, «Ιωνικός - <αντίπαλος>», date/time, days/hours/minutes boxes in the display font (updated every 30 s, timer cleaned up), «Θα είμαι εκεί» toggle (`.btn--gold`, then «Θα είμαι εκεί ✓» as `.btn--success`), «Έρχονται N φίλαθλοι»; fallback «Το πρόγραμμα ανακοινώνεται σύντομα». Index hero shows it (works logged out: RSVP button links to login). App Card tab under the pass; web Κερκίδα page.
- [ ] **Step 6: Browser verify** index (logged out and in), app, web; 375px.
- [ ] **Step 7: Commit** («Αντίστροφη μέτρηση και Θα είμαι εκεί»).

### Task 6: History page

**Files:** Create `tests/history.test.js`. Modify `data.js` (`HISTORY`), `web.js` (route `history` «Ιστορία», last; `viewHistory`), `index.html` (link card «Η ιστορία μας»), `app.css` (`.timeline`).

**Interfaces:**
- `D.HISTORY = { intro, facts:[{label, value}], timeline:[{year, sport:"football"|"basketball"|"club", title, text, source}], sections:[string], sources:[{id, name, url}] }`. Every `timeline[].source` is a `sources[].id`. Content exactly the spec's list (no disputed items).

- [ ] **Step 1: Failing tests**: `timeline_chronological` (years non-decreasing by first 4 digits), `every_item_sourced`, `founding_fact` (facts contain «29 Ιουνίου 1965»), `no_disputed_items` (no text mentions «Κύπελλο Πειραιά» or «Μεγάλη Δευτέρα»).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Write** the data.
- [ ] **Step 4: Run** → `ALL PASS`.
- [ ] **Step 5: UI** `web.html#history`: `.matchday.theme-dark.crest-watermark` hero with eyebrow «Ιστορία», title «Από το 1965 στη Νίκαια», intro; three fact cards; vertical `.timeline` (year in display font, gold dot, sport chip «Ποδόσφαιρο»/«Μπάσκετ»/«Σύλλογος»); «Τα τμήματα» chips; «Πηγές» list with links.
- [ ] **Step 6: Browser verify** desktop and 375px; links open in new tab.
- [ ] **Step 7: Commit** («Σελίδα ιστορίας του συλλόγου»).

### Task 7: Regression, review, publish

- [ ] **Step 1:** `sh tests/run.sh` → `ALL PASS`; glyph/screen-number grep over site files finds nothing.
- [ ] **Step 2:** Browser regression: QR 60s rotation, subscription flows, scanner 4 outcomes, till, trophies unlock, standings, pinned video, 375px sweep over every page and every app/web tab for Μαρία, Γιώργος and admin, console clean.
- [ ] **Step 3:** Final whole-branch review by a fresh reviewer; fix Critical/Important with a failing test first.
- [ ] **Step 4:** Bump `?v=`, commit, push to `main`, wait for Pages, repeat the key checks on the live site.
