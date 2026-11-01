# Customize Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One «ປັບແຕ່ງ» screen where a player previews and changes card back, arena, avatar, frame, title and pet; the shop only sells.

**Architecture:** A new menu screen `ui.screen = 'style'` rendered by `styleHTML()` inside `index.html` (menu screens use `innerHTML`). Each tab lists items from existing data (`PM_BACK_ART`, `THEMES`, `AVATARS()`, `FRAMES`, `TITLES`, `PETS`) through one helper, and every "use" goes through one async function that calls the existing save paths. Old pickers in shop, settings, profile, achievements and the pet modal are reduced to links.

**Tech Stack:** Plain JS/CSS in the single file `index.html`; Supabase JS (already loaded lazily) for `premium_equip` and the `profiles` row; headless WebKit (`tools/wk.swift`) for tests.

**Spec:** `docs/superpowers/specs/2026-10-31-customize-page-design.md`

## Global Constraints

- All player-facing text in Lao; keep the game's existing tone (short words). Nav label: «ປັບແຕ່ງ».
- No SQL and no `supabase/functions` changes. Paid items are equipped only through `premium_equip` (server checks ownership).
- After every change to the script run `python3 tools/build-security.py` (refreshes CSP hashes; skipping it blocks the page).
- No full-screen dark or white overlays (AGENTS.md hard rule); the locked-item sheet is a normal `.modal`.
- Layout must fit 360 px wide with no horizontal scroll; desktop 1280×800.
- Commit only when the owner says so (AGENTS.md). Do not touch Codex's uncommitted files (`PLAN.md`, `design/premium-shop.md`, `design/payment-qr-amounts.md`, `art/payments/*`).

## Review Focus

1. Guest without a profile opens the avatar tab → sees «ສ້າງຜູ້ຫຼິ້ນ», no crash, no Supabase call.
2. `PM.state` not loaded yet (slow network) → paid tiles show locked/«ກຳລັງໂຫຼດ», tapping does nothing harmful; page re-renders when it loads.
3. `premium_equip` fails (offline) → tile does not show ✓, a toast explains, the previous choice stays.
4. Saved `SET.theme` is `starjars` with `SET.meteor` true but the account no longer owns the meteor arena → free starjars shown as in use, no paid look.
5. Six-button bottom nav at 360 px → no wrap, no overflow.

---

### Task 1: The page shell (entry, preview, tabs, tiles)

**Files:**
- Modify: `index.html` (CSS block near `.h2nav` rules ~line 1874; menu `render()` branch ~line 5404; `menuHTML` nav ~line 5487; click handler `$app` menu actions ~line 8740; `__dbg` line)
- Test: `tools/style-page-test.js` (create)

**Interfaces:**
- Produces:
  - `ui.styleTab: 'back'|'arena'|'avatar'|'frame'|'title'|'pet'` (default `'back'`)
  - `STYLE_TABS: Array<[id, label]>` = `[['back','ຫຼັງກາດ'],['arena','ສະໜາມ'],['avatar','ຮູບ'],['frame','ກອບ'],['title','ຊື່ສຽງ'],['pet','ຄູ່ຫູ']]`
  - `styleItems(tab): Array<{id:string, name:string, art:string /*html*/, on:boolean, owned:boolean, how:string, shop:boolean}>`
  - `frameOwned(id): boolean` — `!id || ACH.some(a => a.frame === id && (col().ach||{})[a.id])` (move the achievements modal's test here and use it there too)
  - `styleHTML(): string`
  - actions: `style` (open page; `data-v` = optional tab), `stab` (switch tab), `styleback` (back to menu)
  - `__dbg.style = {items: styleItems}`

- [ ] **Step 1: Write the failing test** `tools/style-page-test.js` (run as a wk script on `http://localhost:8123/`; guest via `[data-a="lguest"]`; returns JSON). Assertions:
  - home nav has 6 buttons and one is `[data-a="style"]`, nav `scrollWidth <= clientWidth` at 360 px
  - clicking it renders `.style-page` with 6 `[data-a="stab"]` buttons and a `.style-prev` preview
  - each tab renders ≥1 `.stile`; `back` has 4 tiles, `arena` 6, `avatar` = `AVATARS().length`, `frame` = `FRAMES.length`, `title` = `TITLES.length`, `pet` = `PETS.length`
  - exactly one `.stile.on` per tab
  - `document.documentElement.scrollWidth <= innerWidth` on every tab; `__errs` empty

- [ ] **Step 2: Run it to see it fail**

Run: `python3 -m http.server 8123 &` (or preview `game`), then `/tmp/wk "http://localhost:8123/?t=$(date +%s)" 360 800 tools/style-page-test.js /tmp/style.png`
Expected: JS error / `Missing style` failure.

- [ ] **Step 3: Implement** `STYLE_TABS`, `frameOwned`, `styleItems`, `styleHTML`, the nav button (between `book` and `shop`, icon `UIC('style')` with 🎨 fallback like other missing UI icons) and the three actions. `styleHTML` = `.bhead` with «← ເມນູ» + title «ປັບແຕ່ງ», `.style-prev` (avatar in `fr-<frame>` ring, name or «ແຂກ», current title, pet face via `petFace`, a mini lane using the current `SET.theme` lane image with a deck pile showing `pmBack(equipped back)`), tab row, grid of `.stile` buttons (`data-a="suse"` when owned, `data-a="slock"` when not; both `data-v=id`). Tiles show `art`, `name`, ✓ when `on`, 🔒 + `how` when locked. Call `premiumLoad()` when the page opens. Desktop ≥900 px: preview left (sticky), tabs+grid right.

- [ ] **Step 4: Rebuild and run the test**

Run: `python3 tools/build-security.py && /tmp/wk "http://localhost:8123/?t=$(date +%s)" 360 800 tools/style-page-test.js /tmp/style.png` and again at `1280 800`
Expected: JSON with all checks passed, `errs: []`; screenshots show the layout from the spec.

---

### Task 2: Using items and the locked sheet

**Files:**
- Modify: `index.html` (near `styleHTML`; `menuModalHTML` for the sheet; click handler)
- Test: `tools/style-page-test.js` (extend)

**Interfaces:**
- Consumes: Task 1 `styleItems`, `ui.styleTab`, actions.
- Produces:
  - `styleUse(tab, id): Promise<boolean>` — true when saved
  - `avatarSave(id): Promise<boolean>` — `SB.from('profiles').update({avatar:id}).eq('id', ACCT.user.id)`; on success `ACCT.prof.avatar = id`
  - actions `suse`, `slock`; locked sheet `ui.mmodal = {type:'style', tab, id}` with button `data-a="sshop"` (opens `ui.screen='shop'`, `ui.shopTab='cosmetics'`) or progress text
  - pet tab reachable as `style` with `data-v="pet"`

Save paths per tab (from the spec table): back → `premiumCall('premium_equip', {product_key: id==='default'?'':id, slot:'back'})`; arena → free theme: `SET.theme=id; SET.meteor=false; saveSet()`; `meteor` → reuse the existing `theme`/`meteor` handler logic (factor it into `meteorUse()` and call it from both); avatar → `avatarSave`; frame → `col().frame=id; saveCol(); profPush()`; title → `col().title=id; saveCol(); profPush()`; pet → `col().pet=id; saveCol()`. Each successful use: `sfx('click')`, re-render; failure: toast «ບັນທຶກບໍ່ສຳເລັດ ລອງໃໝ່», nothing changes.

- [ ] **Step 1: Extend the test** (guest and mocked account via `__dbg.pm({...})` with `owned:['back-naga']`):
  - arena tab: tap `himma` → `.stile.on[data-v="himma"]`, `SET.theme==='himma'` after reload of settings (`localStorage['lao-legend-settings']`)
  - frame tab: tap the default frame → on; a locked frame tile has `data-a="slock"` and opens `.modal` with progress text
  - title/pet: tap owned → on and `col()` value changed (`__dbg` access to `col` via `__dbg.style`)
  - back tab with mock: `back-sinh` is `slock`; its sheet has `[data-a="sshop"]`, which opens the shop on the cosmetics tab
  - before any mock (`PM.state` null): back tab paid tiles are `slock`, their sheet says «ເຂົ້າບັນຊີເພື່ອຊື້» (guest) and no `premium_equip` call is made; after `__dbg.pm(...)` the page re-renders with the owned tile usable
  - guest avatar tab: tiles are locked with «ສ້າງຜູ້ຫຼິ້ນ», no network request to `/rest/v1/profiles`
  - meteor not owned: `SET.theme='starjars'; SET.meteor=true` + mock without `arena-meteor` → `starjars` tile is `.on`, meteor tile locked
  - `premium_equip` failure: mock `premiumCall` rejection (set `__dbg.pmFail=true`, read by a one-line test hook in `premiumCall`) → toast shown, previous `.on` unchanged

- [ ] **Step 2: Run it, expect failures** (same command as Task 1, Step 4).

- [ ] **Step 3: Implement** `styleUse`, `avatarSave`, `meteorUse`, the sheet and the actions as listed.

- [ ] **Step 4: Rebuild and run at 360×800 and 1280×800** — expected all checks pass, `errs: []`.

---

### Task 3: Reduce the old pickers to links

**Files:**
- Modify: `index.html` — `premiumShopHTML` cosmetics tab (~5714) and the `pmequip`/`pmreset` handler (~5762); `settingsHTML` theme section (~3511); `profHTML` edit view (~7915) and the title button (~7715); achievements modal frames (~5962); home `pet` mini button (~5480) and `pet` modal (~5965, ~8703, ~8742)
- Modify: `AGENTS.md` (one line under "Where things live" / engine map: the customize page and its functions)
- Modify: `prompts/ui-home.txt` (append the nav icon prompt `art/ui/style.webp`, same style block as the other nav icons)
- Test: `tools/style-page-test.js` (extend)

**Interfaces:**
- Consumes: Task 1 `style` action with `data-v` tab; Task 2 `meteorUse`.

Changes:
- Shop cosmetics: owned products show «✓ ມີແລ້ວ · ໄປໃຊ້» (`data-a="style" data-v="back"|"arena"`); remove «ເລືອກໃຊ້/ກຳລັງໃຊ້» and both reset buttons; after `pmbuyok` success the toast reads «ຊື້ແລ້ວ · ໄປໃຊ້ໃນ ປັບແຕ່ງ».
- Settings out of a game: the «ໜ້າຕາສະໜາມ» section becomes one `.stlink` «🎨 ປັບແຕ່ງ» (`data-a="style" data-v="arena"`, closes settings). In a game (`S` set) keep `themePicker()` as it is now.
- Profile: edit view keeps the name input only for an existing player (create flow keeps the avatar grid); «🎖️ ສະມັນຍາ» → `style`/`title`.
- Achievements modal: frames row shows frames as rewards (no `data-a="frame"`); remove the `frame` action.
- Home «ຄູ່ຫູ» → `style`/`pet`; delete the `pet` modal branch and `petpick`/`pet` actions.

- [ ] **Step 1: Extend the test:** shop cosmetics with the mock has no `[data-a="pmequip"]`/`[data-a="pmreset"]` and an owned tile has `[data-a="style"]`; settings outside a game has no `.themes` and has `[data-a="style"]`; settings during a game still has `.themes`; home `[data-a="style"][data-v="pet"]` exists and `[data-a="pet"]` does not; achievements modal has no `[data-a="frame"]`.
- [ ] **Step 2: Run, expect failures.**
- [ ] **Step 3: Implement the changes above**, plus the AGENTS.md line and the icon prompt.
- [ ] **Step 4: Rebuild, run the whole test at 360×800 and 1280×800; play one guest bot game for 3 turns (theme and back visible on the board), `errs: []`.**
- [ ] **Step 5: Ask the owner (in Lao) to try it, then commit and push only when they say so.**
