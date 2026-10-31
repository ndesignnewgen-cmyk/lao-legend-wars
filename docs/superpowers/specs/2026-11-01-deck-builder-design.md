# Deck builder redesign (ໜ້າຈັດເດັກໃໝ່) · design

Date: 2026-11-01 · Status: approved in chat by the owner, waiting for review of this file.
Part 2 of 2 (part 1, the customize page, shipped in af7a302).

## ສະຫຼຸບພາສາລາວ (for the owner)

1. ໜ້າ «ເດັກຂອງຂ້ອຍ» ເປີດກ່ອນ: ເດັກທີ່ບັນທຶກ ເປັນກ່ອງ (ຮູບ, ຊື່, ດາວ, ຈຳນວນໃບ, ຊະນະ). ປຸ່ມ ແກ້ · ຫຼິ້ນ · ກັອບ · ລະຫັດ · ລຶບ.
   ມີ «＋ ສ້າງເດັກໃໝ່»: ເລີ່ມຫວ່າງ, ເລີ່ມຈາກເດັກສຳເລັດຮູບ, ຫຼື ວາງລະຫັດເດັກ.
2. ຄອມ: 3 ຖັນ.
   - ຊ້າຍ: ຂໍ້ມູນກາດໃຫຍ່ແບບໃນເກມ.
   - ກາງ: ກາດທັງໝົດ, ມີ ＋/－ ໃນກາດ. ກັ່ນຕອງ ຊື່ · ບຸນ · ປະເພດ · ເຜົ່າ · ເດັກ · ລຽງ. «ສະເພາະທີ່ມີ» ເປີດໄວ້ກ່ອນ.
   - ຂວາ: ເດັກ ມີຮູບກາດນ້ອຍ, ດາວ, ກາຟບຸນ, ຄຳແນະນຳ, ກາດແນະນຳ.
3. ໂທລະສັບ: 2 ແຖບ [ກາດ | ເດັກ]. ແຕະຮູບກາດ → ຂໍ້ມູນກາດຂຶ້ນຈາກລຸ່ມ.
4. ດາວ ⭐ 1–5, ຄຳແນະນຳ 3 ຂໍ້, ກາດແນະນຳ 6 ໃບ, ປຸ່ມ «⚔️ ລອງຫຼິ້ນ» ກັບບອດກາງ. ຈົບເກມແລ້ວ ມີປຸ່ມ «ກັບໄປຈັດເດັກ».
5. ອອກໂດຍບໍ່ບັນທຶກ → ຖາມກ່ອນ. ກົດຈັດເດັກຄືເກົ່າ. ບໍ່ຕ້ອງ Run SQL ຫຼື Deploy.

## Goal

Make building a deck easy on phone and computer: find cards fast, add/remove from the card itself, read the card like
in a game, see whether the deck is good and what to add, and manage saved decks in one place.

Success: a new player builds a legal 30-card deck from owned cards without leaving the screen, on a 360 px phone, and
can see at a glance how good it is and what is wrong.

## What stays

Rules and storage do not change: `RULE {min:30, max:40, copies:3}`, legend once, `deckIssues`, `addBlock`,
`col().decks` (max 10, `{id, name, list, p, w}`), deck code format (`type === 'code'` modal), `autoFill`, `testDraw`,
`saveEditor`, `fusionsOf`, `RITES`, `baseDeckOf`, `coverOf`. The deck picker modal (`decks`) keeps choosing which deck
to play.

## Screens

### My decks (`ui.screen = 'mydecks'`)

Entry: home «ຈັດເດັກ» (`ednew` today), the deck picker's «ສ້າງເດັກ» (`pknew`), and «← ເດັກຂອງຂ້ອຍ» from the builder.

- Header «ເດັກຂອງຂ້ອຍ N/10» + «← ເມນູ».
- Grid of saved decks. Each tile: cover art (`coverOf`), name, stars (`deckStars`), «30/30», wins «ຊະນະ w/p» when p>0,
  first issue with ⚠️ when `deckIssues` is not empty. Buttons: ແກ້ (open builder), ຫຼິ້ນ (disabled with issues;
  `setDeck('c:'+id)` + `startSelected()`), ກັອບ (new deck «<name> (2)» when under 10), ລະຫັດ (code modal for that deck),
  ລຶບ (two taps, like today).
- First tile «＋ ສ້າງເດັກໃໝ່» (hidden at 10 decks, with a note) opens a small sheet: «ເລີ່ມຫວ່າງ», «ຈາກເດັກສຳເລັດຮູບ»
  (grid of the 25 ready decks; copies only owned cards, same as `edsel` does today), «ວາງລະຫັດເດັກ».

### Builder (`ui.screen = 'builder'`)

Desktop ≥ 1000 px: three columns. 600–999 px: pool + deck (inspector as the bottom sheet). Below 600 px: tabs.

**Inspector (left)** — reuses the in-game card detail (`detailHTML` with `ui.detail = {id}`), large card art, and big
＋ / － buttons with «ໃນເດັກ n / ມີ m». Pointer hover on a pool or deck card sets it (desktop); tap sets it everywhere.
Empty state: a short tip.

**Pool (centre)**
- One filter row: search text, cost chips 0–7+, type select (ຕົວລະຄອນ/ຄາຖາ/ຂອງວິເສດ/ກັບດັກ/ສະຖານທີ່), tribe select
  (`TRIBE_NAME`), deck select (ທັງໝົດ · ເດັກ 1–25 by `DORDER` · ກາດກາງ), sort select (ບຸນ · ຊື່ · ພະລັງ), and «ສະເພາະທີ່ມີ»
  toggle **on by default**. On phones the selects fold behind a «ກັ່ນຕອງ» button that shows how many filters are on.
- Card tiles: card art (`cardHTML`), a count badge «n/m», and ＋ / － buttons on the card (＋ disabled with the reason
  from `addBlock` as its title; － hidden at 0). Tapping the art opens the inspector. Unowned cards (when the toggle is
  off) are greyed with 🔒.

**Deck (right)**
- Name input, «24/30–40», stars, cost curve (`costCurve`), tribe chips, special cards (fusion/rite) as today.
- Rows sorted by cost: small card art thumbnail, cost, name, ×n, ＋ / －.
- 💡 tips (`deckTips`, max 3) and «ກາດແນະນຳ» (`deckSuggest`, 6 small cards with ＋).
- Buttons: 💾 ບັນທຶກ · ⚔️ ລອງຫຼິ້ນ (disabled with issues) · ✨ ເຕີມໃຫ້ເອງ · 🎴 ຈົ່ວລອງ · 🔗 ລະຫັດ · ລ້າງ · «← ເດັກຂອງຂ້ອຍ».

**Phone (< 600 px)**: a sticky tab bar «ກາດ | ເດັກ n/30 ⭐» switches pool and deck; the count pulses briefly after
＋/－. The inspector is a bottom sheet with ＋/－ and ✕.

**Leaving with unsaved changes** (back to my decks or menu): a confirm sheet «ບັນທຶກ · ບໍ່ບັນທຶກ · ຍົກເລີກ».
Unsaved = `ui.ed.list`/name differ from the saved deck (or a new deck with ≥1 card).

**Test play**: ⚔️ saves, starts a medium-bot game (`startSelected` with `level:1`) and sets `ui.edReturn = deck id`.
The game-over modal shows «ກັບໄປຈັດເດັກ» when `ui.edReturn` is set; it reopens the builder on that deck.

## Deck quality

`deckStars(list): 0..5` (0 shown only for an empty deck):
- +1 legal size (`sizeOK`)
- +1 curve: cards with cost ≤ 2 ≥ 8 **and** cards with cost ≥ 6 ≤ 6
- +1 characters (type `char`) ≥ 14
- +1 a legend in the deck
- +1 focus: the biggest tribe ≥ 50 % of the characters, or ≥ 60 % of all cards come from `DECKS[baseDeckOf(list)]`
Shown as ⭐ filled/empty; greyed with «ຍັງບໍ່ຄົບ» while the size is not legal.

`deckTips(list): string[]` (max 3, in this order, skipping ones that do not apply):
1. the first `deckIssues` line
2. «ກາດບຸນ 1–2 ມີ n ໃບ ໜ້ອຍເກີນ: ຕົ້ນເກມຈະຊ້າ» when cost ≤ 2 count < 8
3. «ກາດບຸນ 6 ຂຶ້ນໄປ ມີ n ໃບ ຫຼາຍເກີນ» when > 6
4. «ຕົວລະຄອນ n ໃບ ໜ້ອຍເກີນ (ຄວນ 14 ຂຶ້ນໄປ)» when < 14
5. «ມີ A ແລ້ວ ໃສ່ B ຈະຮ່ວມຮ່າງ F ໄດ້» for a fusion F = [A, B] with A in the deck and B owned but not in it
6. «ຍັງບໍ່ມີກາດຕຳນານ» when none
All good → «✅ ເດັກນີ້ດີແລ້ວ».

`deckSuggest(list): id[]` (6): owned, not at `min(owned, copies)` in the deck, allowed by `addBlock`, not fusion/ritual/
token; score = 3 if in `DECKS[baseDeckOf(list)].list` + 2 if same tribe as the deck's biggest tribe + 2 if it completes
a fusion pair + 1 if its cost fills the lowest curve slot among 1–5; ties by cost. Empty deck → the base deck is the
player's selected ready deck.

## Rendering

The builder and my-decks screens render through `render()` like other menu screens, but with `morph($app, …)` (already
used for the game board) so ＋/－ updates do not reset scroll or repaint every card; `edRefresh` and its element-id
patching are removed.

## Not in scope

New deck rules, more than 10 saved decks, server-side decks, card crafting changes, bot-win-rate simulation in the
builder.

## Testing

`tools/deck-builder-test.js` (wk, guest, 360×800 and 1280×800): my decks empty state and «＋ ສ້າງເດັກໃໝ່» (3 ways);
start from a ready deck → builder with only owned cards; ＋/－ on a pool card, in the inspector and in deck rows keep
counts in sync; filters (type, tribe, deck, cost, search, owned toggle) narrow the pool; tips and stars for crafted
lists (unit-style calls through `__dbg.deck`: `deckStars`, `deckTips`, `deckSuggest`); save, copy, delete (two taps),
code modal; unsaved-changes sheet; phone tabs and bottom-sheet inspector; no horizontal overflow; `__errs` empty;
a test-play game shows «ກັບໄປຈັດເດັກ» at game over.
