# Deck Builder Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A «ເດັກຂອງຂ້ອຍ» screen plus a rebuilt deck builder (3 columns on desktop, 2 tabs on phones) with ＋/－ on cards, an in-game style card inspector, deck stars, tips and suggestions.

**Architecture:** All in `index.html`. Pure helpers (`deckStars`, `deckTips`, `deckSuggest`, `poolIds`) are added first and tested through `__dbg.deck`. Two menu screens (`mydecks`, `builder`) render through `render()` with `morph` (like the game board). Existing rules/storage helpers stay (`deckIssues`, `addBlock`, `saveEditor`, `autoFill`, `testDraw`, code modal).

**Tech Stack:** Plain JS/CSS in `index.html`; headless WebKit (`tools/wk.swift`) tests.

**Spec:** `docs/superpowers/specs/2026-11-01-deck-builder-design.md`

## Global Constraints

- Lao UI text; deck rules unchanged: `RULE {min:30, max:40, copies:3}`, legend ×1, max 10 saved decks.
- After every script change: `python3 tools/build-security.py`.
- No full-screen dark/white overlays; bottom sheets use the normal `.modal`.
- 360 px wide: no horizontal scroll. Breakpoints: < 600 px tabs, 600–999 px two columns, ≥ 1000 px three columns.
- Commit only when the owner asks; leave Codex's uncommitted files alone.

## Review Focus

1. A saved deck whose cards the player no longer owns (e.g. after a reset) → my-decks tile shows ⚠️ with the first issue, ຫຼິ້ນ disabled, builder opens it without crashing.
2. 10 saved decks → «＋ ສ້າງເດັກໃໝ່» and ກັອບ are disabled with a note; no 11th deck is written.
3. Filters that match nothing → «ບໍ່ພົບກາດ» plus a «ລ້າງກັ່ນຕອງ» button.
4. Rapid ＋ taps on a card at its limit (3 copies / legend / owned count) → never exceeds `addBlock`; the reason is shown.
5. Leaving the builder mid-edit through the bottom nav or browser back → the unsaved sheet appears; choosing «ບໍ່ບັນທຶກ» discards.

---

### Task 1: Deck quality helpers

**Files:** Modify `index.html` (next to `costCurve` ~line 3054; `__dbg`). Create `tools/deck-builder-test.js`.

**Interfaces — Produces:**
- `deckStars(list): number` 0–5 per the spec (+1 each: `sizeOK`; cost≤2 count ≥ 8 and cost≥6 count ≤ 6; chars ≥ 14; a legend; biggest tribe ≥ 50 % of chars or ≥ 60 % of cards in `DECKS[baseDeckOf(list)].list`). Empty list → 0.
- `deckTips(list): string[]` max 3, order and Lao text exactly as the spec; none apply → `['✅ ເດັກນີ້ດີແລ້ວ']`.
- `deckSuggest(list, n = 6): string[]` per the spec's scoring.
- `__dbg.deck = {stars:deckStars, tips:deckTips, suggest:deckSuggest, col:() => col()}`

- [ ] **Step 1: Write the failing test** (first section of `tools/deck-builder-test.js`, wk script, guest; same `ok/fail/JSON` harness as `tools/style-page-test.js`):
  - `stars({})===0`; for `DECKS[0].list` (owned or not, it is legal and focused) `stars >= 4`
  - a 30-card list of only cost-7+ characters with no legend → `stars <= 2` and tips include «ກາດບຸນ 1–2» and «ກາດບຸນ 6 ຂຶ້ນໄປ»
  - `tips({})[0]` is the `deckIssues` line «ຂາດອີກ 30 ໃບ»
  - with the guest's owned cards: `suggest({})` returns ≤ 6 owned ids, none fusion/ritual/token, all allowed by `addBlock`
  - a list holding one half of a fusion whose other half is owned → a tip naming the fusion
- [ ] **Step 2: Run it, expect failure** — `/tmp/wk "http://localhost:8123/?t=$(date +%s)" 1280 800 tools/deck-builder-test.js /tmp/db.png` → `fail` mentions `deck` undefined.
- [ ] **Step 3: Implement the three helpers and the `__dbg.deck` hook.**
- [ ] **Step 4: Rebuild, run** → pass, `errs: []`.

---

### Task 2: «ເດັກຂອງຂ້ອຍ» screen

**Files:** Modify `index.html` (menu `render()` branch; home mini `ednew`; deck picker `pknew`; click handler near `ednew`/`edsel`; CSS near `.builder`).

**Interfaces:**
- Consumes: Task 1 `deckStars`.
- Produces: `myDecksHTML(): string`; `ui.screen = 'mydecks'`; actions `mydecks` (open), `mdedit` (v = deck id → `openEditor(id, list, name)`), `mdplay`, `mdcopy`, `mdcode` (opens the existing code modal for that deck: `ui.mmodal = {type:'code', list, name}` — extend the code modal to read `m.list` when given, else `ui.ed.list`), `mddel` (two taps: first sets `ui.mdDel = id`), `mdnew` (sheet `ui.mmodal = {type:'mdnew'}`), `mdempty`, `mdready` (v = DECKS index; same owned-only copy as `edsel`), `mdpaste` (opens the code modal in import mode).
- `ednew` and `pknew` now open `mydecks`.

- [ ] **Step 1: Extend the test:** empty guest → `.mydecks` shows «＋ ສ້າງເດັກໃໝ່» and «0/10»; `mdnew` sheet has the 3 choices; `mdready` with `DECKS[0]` index → builder opens with only owned cards; save → back to my decks shows 1 tile with stars and «ແກ້ ຫຼິ້ນ ກັອບ ລະຫັດ ລຶບ»; `mdcopy` → 2 tiles; `mddel` once → still 2 and the button reads «ກົດອີກເທື່ອ», twice → 1; with 10 decks in `col().decks` the new/copy buttons are disabled; a deck with an issue shows ⚠️ and ຫຼິ້ນ disabled.
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Rebuild, run at 360×800 and 1280×800** → pass, no overflow, `errs: []`.

---

### Task 3: The builder (pool, inspector, deck column, phone tabs)

**Files:** Modify `index.html` — replace `builderHTML`, `edPool`, `edPanel`, `edRefresh` (~5560–5590) and builder CSS (~1447–1470 and its media queries); click handlers `edadd`/`edrem`/`edinfo`/filter actions (~8790); `render()` builder branch uses `morph`.

**Interfaces:**
- Consumes: Task 1 helpers; Task 2 `mydecks` action.
- Produces:
  - `ui.bf = {q, cost, type, tribe, deck, sort, own:true}`; `poolIds(f): string[]`
  - actions: `edadd`/`edrem` (v = id; also used by inspector, rows, suggestions), `edinfo` (sets `ui.detail = {id}`; on < 1000 px opens `ui.mmodal = {type:'edcard', id}`), `edf` (v = `key:value` filter change), `edfclear`, `edtabs` (v = `pool`|`deck`, phone), `edfold` (phone filter toggle)
  - pointer hover on `[data-insp]` sets `ui.detail` (desktop only, reuse the existing `pointerover` listener)

- [ ] **Step 1: Extend the test:** desktop has `.ed-insp`, `.ed-pool`, `.ed-deck`; pool tile ＋ adds (`.ed-deck` count 1, tile badge «1/m»), － removes; inspector ＋/－ match; deck row ＋/－ match; ＋ at the limit stays at the limit and the button is disabled with a title; each filter narrows `poolIds` and the tile count; nothing matches → «ບໍ່ພົບກາດ» + `edfclear`; owned toggle default on (no `.nown` tiles); suggestions ＋ adds that card; phone: tabs present, deck tab shows the rows, `edinfo` opens `.modal` with ＋/－; scroll position of the pool stays after ＋ (`.ed-pool` `scrollTop` unchanged); `__dbg.morphCheck`-style comparison not needed here.
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement** (morph render, three layouts by width via CSS; one HTML for all widths: `.ed-wrap` with the three sections, tabs bar visible only < 600 px, inspector hidden < 1000 px).
- [ ] **Step 4: Rebuild, run at 360×800, 800×800 and 1280×800** → pass, no overflow, `errs: []`.

---

### Task 4: Unsaved changes and test play

**Files:** Modify `index.html` (builder leave paths: `edback`/`mydecks`/bottom nav/`popstate` if used; `edplay`; game-over modal).

**Interfaces:**
- Consumes: Tasks 2–3.
- Produces: `edDirty(): boolean`; sheet `ui.mmodal = {type:'edleave', next}` with actions `edlsave`, `edldrop`, `mmclose`; `ui.edReturn = deck id` set by ⚔️ (`edplay`), consumed by a «ກັບໄປຈັດເດັກ» button (`edreturn`) on the game-over modal.

- [ ] **Step 1: Extend the test:** change a card then «← ເດັກຂອງຂ້ອຍ» → `.modal` with 3 buttons; «ບໍ່ບັນທຶກ» → my decks without the change; «ບັນທຶກ» → saved; unchanged deck leaves without a sheet; ⚔️ on a legal deck starts a level-1 game; forcing game over (`__dbg` win hook or `S.p[1].hp = 0` + `checkDeaths`) shows `[data-a="edreturn"]`, which reopens the builder on that deck.
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Rebuild; run the whole test at 360×800 and 1280×800; run `tools/style-page-test.js` too (shared menu code)** → all pass, `errs: []`. Add the builder's functions to the AGENTS.md engine map line.
- [ ] **Step 5: Ask the owner (Lao) to try it; commit and push only on their word.**
