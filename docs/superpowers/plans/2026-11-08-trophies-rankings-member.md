# Τρόπαια, βαθμολογίες, απλό μέλος και ορατό live: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PlayStation-style trophies with chat titles, a simple (childless) member account with per-account subscriptions, a standings page for 3 sports x 4 groups, and a live view where video and chat are visible together on every screen size.

**Architecture:** Plain HTML/CSS/JS, no build. Data in `assets/js/data.js`, logic stores in `assets/js/core.js` (`Membership`, new `Trophies`), views in `app.js` / `web.js` / `scanner.js` / `merchant.js`. Logic is unit-tested in Node by loading `data.js` + `core.js` into a `vm` context with an in-memory `localStorage`; UI is verified in the built-in browser.

**Tech Stack:** Vanilla JS (ES2017), CSS custom properties, Node 18+ `vm` + `assert` for tests, `python3 -m http.server` for preview.

**Spec:** `docs/superpowers/specs/2026-11-08-trophies-rankings-member-design.md`

## Global Constraints

- All UI copy in natural Greek; all-caps Greek only via `upper()` from `core.js`, never `toUpperCase()` on Greek.
- No em dash, en dash or minus-sign glyphs anywhere (code, copy, comments, commits). Plain hyphens only.
- No deck screen numbers ("Οθόνη 0X") anywhere. Single club only.
- Crest `assets/img/crest.svg` on every page and as favicon. Colours from tokens in `assets/css/tokens.css`.
- One `.btn` system; reuse existing components (`.card`, `.option`, `.segmented`, `.chip`, `.row`, `.pass`, `.section-title`, `.badge`).
- Existing flows keep their behaviour: rotating QR (60s), scanner valid/duplicate/expired/rejected, merchant till, subscription edit (add/remove, monthly/yearly, pause, reactivate with payment choice).
- No backend; persistence only through `Store` (prefix `ion1965:`).
- Commits: Greek message ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Bump `?v=` in every HTML file before the final push.

## Review Focus

1. Returning visitor with old `ion1965:membership` key (no account suffix) must keep Γιώργος's family, cycle and paused state after the upgrade. Test in Task 1.
2. Scanner/merchant with no member logged in (or logged in as Μαρία) must still resolve Γιώργος's and Κωστής's cards, and a card of a paused account must read expired. Test in Task 1.
3. Repeating an action after a trophy is unlocked must not unlock it again or toast again. Test in Task 2.
4. `setTitle` with a locked or unknown trophy id must be refused and leave the current title unchanged. Test in Task 2.
5. Demo reset must clear trophies and the current account's subscription but not log the user out. Test in Task 2 (`Trophies.reset`) and checked in Task 4.

---

### Task 1: Node test harness, per-account subscription, Μαρία account

**Files:**
- Create: `tests/harness.js`, `tests/membership.test.js`, `tests/run.sh`
- Modify: `assets/js/data.js` (ACCOUNTS, PROFILES, KNOWN_CARDS untouched), `assets/js/core.js` (`Membership`, `Auth.login`, `resolveCard`)

**Interfaces:**
- Produces: `loadCore() -> { ION, D, storage }` (fresh context per call) in `tests/harness.js`.
- Produces: `Membership.get(accountId?)`, `Membership.save(m, accountId?)`, `Membership.reset(accountId?)`, `Membership.members(accountId?)`; default account = logged-in member, else `"u_giorgos"`.
- Produces: `Membership.findCardAnywhere(code) -> { member, accountId, paused } | null`.
- Produces: `resolveCard(code)` now also returns `profileId` (member id) when the card belongs to a subscription.

- [ ] **Step 1: Write the harness** `tests/harness.js`: `vm.createContext` with `localStorage` backed by a `Map` (`getItem`, `setItem`, `removeItem`, `key`, `length`, and `Object.keys` support via a Proxy or by also mirroring keys as own properties), `window` = the context itself, `document` stub `{ createElement(){ return {style:{},appendChild(){},setAttribute(){},addEventListener(){}} }, body:{appendChild(){}} }`, `setTimeout`, `Intl`, `Date`. Run `data.js` then `core.js` with `vm.runInContext`. `loadCore(seedStorage)` accepts an optional object of raw `localStorage` entries. `tests/run.sh`: `for f in tests/*.test.js; do node "$f" || exit 1; done; echo ALL PASS`.

- [ ] **Step 2: Write failing tests** `tests/membership.test.js` (plain `assert`, each test a named function, print `ok <name>`):
  - `maria_account_exists`: `D.ACCOUNTS` has `email "maria@ionikos.gr"`, `password "ionikos1965"`, `role "member"`, `profiles ["p_maria"]`; `D.PROFILES.p_maria.cardCode === "ION-2190"`, `levelId "casual"`, `monthsMember 4`, `kind "adult"`, `kindLabel "Μέλος"`.
  - `login_maria_gets_own_subscription`: after `Auth.login("maria@ionikos.gr","ionikos1965")`, `Auth.profiles().map(p=>p.id)` deep-equals `["p_maria"]` and `Membership.totals().perMonth === 20`.
  - `accounts_are_isolated`: log in Μαρία, `Membership.cancel()`; log in Γιώργος: `Membership.get().status === "active"` and 2 members.
  - `legacy_key_migrates_to_giorgos`: seed storage `{"ion1965:membership": JSON with status "cancelled", cycle "yearly", 2 members}`; after login as Γιώργος `Membership.get()` has `status "cancelled"`, `cycle "yearly"`; storage has `ion1965:membership:u_giorgos` and no `ion1965:membership`.
  - `scanner_finds_cards_across_accounts`: logged in as Μαρία, `resolveCard("ION-5513").state === "valid"` and `.profileId === "p_kostis"`; `resolveCard("ION-2190").profileId === "p_maria"`.
  - `paused_account_card_is_expired`: Γιώργος `cancel()`, then logged out: `resolveCard("ION-8472").state === "expired"`; `resolveCard("ION-2190").state === "valid"`.
  - `removed_seed_card_does_not_open`: remove Κωστής from Γιώργος, `resolveCard("ION-5513") === null`.

- [ ] **Step 3: Run** `sh tests/run.sh`. Expected: FAIL on `maria_account_exists`.

- [ ] **Step 4: Implement.** Add `u_maria` account (displayName "Μαρία Κωνσταντίνου", memberSince "2026-07-01") and `p_maria` profile (shortName "Μαρία", statusLabel "ΕΝΕΡΓΗ", monthlyFee 20). In `Membership`: replace `SEED_PROFILE_IDS` with the account's `profiles`; key `"membership:" + accountId`; on first `get("u_giorgos")` move legacy `"membership"` into it; `findCardAnywhere` iterates `D.ACCOUNTS` with `role "member"`; `resolveCard` uses it and keeps the "removed seed card" rule for every seed card code of every member account. `cancel`, `pay`, `addMember`, `removeMember`, `setCycle`, `setPaymentMethod`, `totals` keep their current signatures and act on the default account.

- [ ] **Step 5: Run** `sh tests/run.sh`. Expected: `ALL PASS`.

- [ ] **Step 6: Browser check** existing flows: as Γιώργος on `web.html#subscription` add/remove member, yearly/monthly, pause, reactivate (Viva). Scanner `live:ION-8472` valid then duplicate.

- [ ] **Step 7: Commit** `git add tests assets/js/data.js assets/js/core.js && git commit` (message: «Συνδρομή ανά λογαριασμό και λογαριασμός απλού μέλους»).

### Task 2: Trophies data and engine

**Files:**
- Modify: `assets/js/data.js` (add `TROPHIES`, `TROPHY_SEED`, `TIERS`; remove `BADGES` from export only after Task 4 stops using it), `assets/js/core.js` (add `Trophies`, export it)
- Create: `tests/trophies.test.js`

**Interfaces:**
- Produces: `D.TROPHIES` array of `{ id, name, title, tier, icon, action, goal, text }` with the 12 rows of the spec table (ids `first_voice, stand_voice, voter, customer, loyal_customer, present, ever_present, traveler, ticket, viewer, loyal, since_1965`; goals 1, 25, 1, 1, 4, 10, 30, 3, 1, 1, 12, 11; `title` = the name unless noted).
- Produces: `D.TIERS = { bronze:{label:"Χάλκινο"}, silver:{label:"Ασημένιο"}, gold:{label:"Χρυσό"}, platinum:{label:"Πλατινένιο"} }`.
- Produces: `D.TROPHY_SEED[profileId] = { counts, shops }` with the spec's starting values (Γιώργος chat 24, gate 9, redeem 4, away 2, shops `["m_square","m_boutique","m_gym"]`; Μαρία gate 2, redeem 1, shops `["m_square"]`; Κωστής empty).
- Produces: `Trophies.record(profileId, action, extra?) -> Trophy[]` (newly unlocked), `Trophies.forProfile(profileId) -> Array<Trophy & {progress, unlocked, unlockedAt}>`, `Trophies.summary(profileId) -> { bronze, silver, gold, platinum, unlocked, total }`, `Trophies.setTitle(profileId, id|null) -> boolean`, `Trophies.title(profileId) -> Trophy|null`, `Trophies.reset()`.
- `months` progress = profile `monthsMember` (from `Membership.findCardAnywhere`-style lookup by profile id across accounts, fallback `D.PROFILES`). `shops` progress = `shops.length`. `since_1965` progress = number of other unlocked trophies. Seeded counts that already meet a goal start unlocked (no toast).

- [ ] **Step 1: Write failing tests** `tests/trophies.test.js`:
  - `twelve_trophies_four_tiers`: `D.TROPHIES.length === 12`; every tier key exists in `D.TIERS`.
  - `seed_progress`: `forProfile("p_giorgos")` gives `stand_voice.progress 24`, `customer.unlocked true`, `present.progress 9`, `loyal_customer.progress 3`.
  - `chat_unlocks_stand_voice_once`: `record("p_giorgos","chat")` returns ids `["stand_voice"]`; a second call returns `[]`.
  - `redeem_burgers_unlocks_loyal_customer`: `record("p_giorgos","redeem","m_burgers")` returns ids containing `"loyal_customer"`; repeating with `"m_burgers"` keeps `shops` length 4.
  - `gate_unlocks_present`: `record("p_giorgos","gate")` returns `["present"]`.
  - `title_only_if_unlocked`: `setTitle("p_giorgos","ever_present") === false` and `title("p_giorgos") === null`; `setTitle("p_giorgos","customer") === true`, `title().id === "customer"`; `setTitle("p_giorgos","nope") === false`, title still `customer`; `setTitle("p_giorgos", null) === true`.
  - `platinum_counts_others`: `forProfile("p_giorgos").find(t=>t.id==="since_1965").goal === 11`.
  - `reset_clears_progress_keeps_session`: after login, record, `Trophies.reset()`: `forProfile` back to seed values and `Auth.account()` still set.
  - `profiles_are_separate`: `record("p_maria","chat")` unlocks `first_voice` for Μαρία, not for `p_kostis`.

- [ ] **Step 2: Run** `sh tests/run.sh`. Expected: FAIL on `twelve_trophies_four_tiers`.

- [ ] **Step 3: Implement** data and `Trophies` in `core.js`. Storage key `"trophies:" + profileId`, shape `{ counts, shops, unlocked:{id:ts}, title }`, created from `TROPHY_SEED` on first read. Card-holder actions (`gate`, `redeem`) take a profile id, not a card code.

- [ ] **Step 4: Run** `sh tests/run.sh`. Expected: `ALL PASS`.

- [ ] **Step 5: Commit** («Μηχανή τροπαίων»).

### Task 3: Record actions everywhere, unlock toast

**Files:**
- Modify: `assets/js/core.js` (add `celebrate(unlocked)`), `assets/js/app.js`, `assets/js/web.js`, `assets/js/scanner.js`, `assets/js/merchant.js`, `assets/css/components.css` (`.toast--trophy`)

**Interfaces:**
- Consumes: `Trophies.record` (Task 2), `resolveCard(...).profileId` (Task 1).
- Produces: `celebrate(list)` shows one toast per unlocked trophy: «Νέο τρόπαιο: <name>» with class `toast--trophy` (gold left rule, tier dot), 4000 ms.

- [ ] **Step 1: Hook calls** (each followed by `celebrate(...)`): app and web chat submit (`"chat"`, active profile), poll vote (`"vote"`), play button when it starts playing (`"watch"`), `issueTicket` success (`"ticket"`), scanner valid entry only (`"gate"`, holder `profileId`, skip when absent), merchant `commit` (`"redeem"`, holder `profileId`, extra `"m_burgers"` from the merchant account's `merchantId`).
- [ ] **Step 2: Browser verify** as Γιώργος: send one chat message on `web.html#live` shows «Νέο τρόπαιο: Ο Κάπο», second message no toast; scanner `live:ION-8472` after reset shows toast «Παιδί της Θύρας»; merchant confirm for Γιώργος shows «Ο Δήμαρχος της Νίκαιας». No console errors.
- [ ] **Step 3: Run** `sh tests/run.sh`. Expected: `ALL PASS`.
- [ ] **Step 4: Commit** («Καταγραφή ενεργειών για τρόπαια»).

### Task 4: Trophies screen and chat title picker in the app

**Files:**
- Modify: `assets/js/app.js` (`viewLevel`, `viewProfile`, demo reset), `assets/css/app.css` (`.trophy-grid`, `.trophy`, `.trophy--locked`, `.trophy__tier`, `.trophy-summary`), `assets/css/tokens.css` (`--tier-bronze:#B4703A; --tier-silver:#9AA3B5; --tier-gold:var(--ion-gold); --tier-platinum:#A7C7E7`), `assets/js/data.js` (drop `BADGES`)

**Interfaces:**
- Consumes: `Trophies.forProfile`, `Trophies.summary`, `Trophies.setTitle`, `Trophies.title`, `Trophies.reset`, `D.TIERS`.

- [ ] **Step 1: Level tab**: replace «Τα παράσημά μου» with section «Τρόπαια», a summary row (count per tier with tier dots, and «X από 12»), then a 2-column grid: tier-coloured icon, name, `text`, and for locked ones a `.progress` bar with «progress/goal».
- [ ] **Step 2: Profile tab**: section «Τίτλος στο chat» with `.options` built from unlocked trophies plus «Χωρίς τίτλο»; selecting calls `setTitle` and toasts «Ο τίτλος σας: <title>». Demo reset also calls `Trophies.reset()`.
- [ ] **Step 3: Browser verify** at desktop and 375px: grid renders for Γιώργος and Κωστής, locked items show progress, picking a title persists after reload, reset restores 24/25. No overflow.
- [ ] **Step 4: Commit** («Οθόνη τροπαίων και επιλογή τίτλου»).

### Task 5: Chat titles and video always visible

**Files:**
- Modify: `assets/js/data.js` (`CHAT_SEED`, `CHAT_AMBIENT` gain `title` trophy ids), `assets/js/core.js` (add `chatLine(m) -> HTMLElement` shared by app and web), `assets/js/app.js`, `assets/js/web.js` (use `chatLine`), `assets/css/app.css` (`.chat__title`, sticky player rules)

**Interfaces:**
- Consumes: `Trophies.title`, `D.TROPHIES`, `D.TIERS`, `levelColor`, `levelById`.
- Produces: `chatLine({ user, levelId, title?, text, profileId? })`: name in level colour, tier dot + title (from `title` id or `Trophies.title(profileId)`), then text. Built with `textContent` only (user text never as HTML).

- [ ] **Step 1: Implement** `chatLine` and switch both chats to it; own messages pass `profileId` of the active profile.
- [ ] **Step 2: Sticky video**: web below 960px `.grid-live .player { position: sticky; top: <nav height>; z-index: 5 }` with the scoreline above it scrolling away; app Live tab: player wrapper `position: sticky; top: 0` inside `.phone__body` with a solid background so chat scrolls under it.
- [ ] **Step 3: Browser verify** at 375px on `web.html#live` and the app Live tab: after scrolling the chat, the player is still fully visible; titles show next to names; a message containing `<b>x</b>` renders as text. Desktop unchanged (side by side).
- [ ] **Step 4: Commit** («Τίτλοι στο chat και βίντεο πάντα ορατό»).

### Task 6: Login labels, single-profile UI, README

**Files:**
- Modify: `login.html` (`DEMO_LABELS` by account id: `u_maria` «Μέλος», `u_giorgos` «Μέλος με παιδί ακαδημίας», others unchanged; order Μαρία first), `assets/js/app.js` (hide `.segmented` switcher when `Auth.profiles().length === 1`; profile family heading «Η συνδρομή μου» when one profile), `README.md` (add Μαρία row, update roles text)

- [ ] **Step 1: Implement** the above.
- [ ] **Step 2: Browser verify**: login as Μαρία via demo button lands on `app.html`, card shows «Μαρία Κωνσταντίνου», no switcher; `web.html#subscription` shows one row at 20,00€; header name opens profile; scanner `ION-2190` (manual token from `ION.Token.build("ION-2190")`) valid. Then login as Γιώργος: family of 2 unchanged.
- [ ] **Step 3: Commit** («Απλό μέλος στο login και στην εφαρμογή»).

### Task 7: Standings

**Files:**
- Modify: `assets/js/data.js` (add `STANDINGS`), `assets/js/web.js` (route `standings`, label «Βαθμολογίες», `viewStandings`), `assets/js/app.js` (Live tab card), `assets/css/app.css` (`.standings`, `.standings tr.is-us`, narrow-column hiding)
- Create: `tests/standings.test.js`

**Interfaces:**
- Produces: `D.STANDINGS = { sports: [{id:"football",label:"Ποδόσφαιρο",draws:true},{id:"basketball",label:"Μπάσκετ",draws:false},{id:"volleyball",label:"Βόλεϊ",draws:false}], groups: [{id:"men",label:"Ανδρών"},{id:"k16",label:"Κ16"},{id:"k14",label:"Κ14"},{id:"k12",label:"Κ12"}], tables: { "<sport>:<group>": { competition, rows:[{team, p, w, d, l, pts}], last:{home, away, score, date}, next:{home, away, date, time, venue} } } }`. Exactly one row per table has `team` starting with «Ιωνικός».
- Produces: `web.html#standings` route.

- [ ] **Step 1: Write failing test** `tests/standings.test.js`: `all_twelve_tables` (every sport x group key exists); `rows_consistent` (each table 6 to 8 rows, `p === w + d + l`, `d === 0` when `draws` false, rows sorted by `pts` desc, football `pts === 3w + d`); `one_ionikos_row`.
- [ ] **Step 2: Run** `sh tests/run.sh`. Expected: FAIL on `all_twelve_tables`.
- [ ] **Step 3: Write** the demo data (invented Attica clubs).
- [ ] **Step 4: Run** `sh tests/run.sh`. Expected: `ALL PASS`.
- [ ] **Step 5: Web view**: `head("Βαθμολογίες", "Οι ομάδες του Ιωνικού")`, `.segmented` for sport, `.chip`s for group, `.card.card--rule` with the table (`.table.standings`, Ιωνικός row `.is-us` gold rule and bold), two cards «Τελευταίο αποτέλεσμα» / «Επόμενος αγώνας». Below 480px hide W/D/L columns. App Live tab: card «Βαθμολογία Κ16» with top 4 + Ιωνικός and link «Όλες οι βαθμολογίες» to `web.html#standings`.
- [ ] **Step 6: Browser verify** all 12 combinations at desktop and 375px, no overflow, no console errors.
- [ ] **Step 7: Commit** («Σελίδα βαθμολογιών»).

### Task 8: Full regression, publish, live check

- [ ] **Step 1:** `sh tests/run.sh` gives `ALL PASS`; `grep -rnP "\x{2014}|\x{2013}|\x{2212}|Οθόνη" --include=*.html --include=*.js --include=*.css --include=*.md .` (excluding `assets/vendor`) finds nothing.
- [ ] **Step 2:** Browser regression on localhost: QR rotates at the 60s boundary, subscription flows, scanner 4 outcomes, merchant till, 375px overflow sweep over every page and every app/web tab, console clean.
- [ ] **Step 3:** Bump `?v=` in every HTML file, commit, `git push origin main`, wait for Pages build, repeat Steps 1 and 2 against `https://aproiosdoukas-beep.github.io/ionikos-1965-mockup/`.
