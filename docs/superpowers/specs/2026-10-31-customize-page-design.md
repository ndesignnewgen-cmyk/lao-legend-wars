# Customize page (ໜ້າປັບແຕ່ງ) · design

Date: 2026-10-31 · Status: approved in chat by the owner, waiting for review of this file.
Part 1 of 2. Part 2, the deck builder redesign, gets its own spec after this one ships.

## ສະຫຼຸບພາສາລາວ (for the owner)

1. ແຖບລຸ່ມມີປຸ່ມທີ 6 «🎨 ປັບແຕ່ງ»: ໜ້າຫຼັກ · ເດັກ · ກາດ · ປັບແຕ່ງ · ຮ້ານ · ໝູ່.
2. ເທິງສຸດມີຕົວຢ່າງໃຫຍ່: ບັດຜູ້ຫຼິ້ນ (ຮູບ, ກອບ, ຊື່, ຊື່ສຽງ, ຄູ່ຫູ) ແລະ ສະໜາມນ້ອຍທີ່ມີກອງກາດ. ປ່ຽນທັນທີທີ່ແຕະ.
3. ມີ 6 ແຖບ: ຫຼັງກາດ · ສະໜາມ · ຮູບໂປຣໄຟລ໌ · ກອບຮູບ · ຊື່ສຽງ · ຄູ່ຫູ.
4. ແຕະຂອງທີ່ມີ ແມ່ນໃຊ້ທັນທີ ແລະ ບັນທຶກເອງ. ຂອງທີ່ຍັງບໍ່ມີ ຂຶ້ນ 🔒 ພ້ອມບອກວິທີໄດ້:
   - ຂອງຊື້ → ພາໄປຮ້ານ.
   - ຂອງລາງວັນ → ບອກວ່າເຫຼືອອີກເທົ່າໃດ.
5. ຮ້ານມີແຕ່ຊື້. ຕັ້ງຄ່າ ແລະ ໂປຣໄຟລ໌ ບໍ່ມີບ່ອນເລືອກຂອງຕົບແຕ່ງອີກ, ມີປຸ່ມພາມາໜ້ານີ້ແທນ.
6. ບໍ່ຕ້ອງ Run SQL ໃໝ່. ບໍ່ຕ້ອງ Deploy ເຊີບເວີ.

## Goal

One place to choose every look item. Today they are spread over four places:
- card backs: shop → cosmetics tab (`pmequip`);
- arenas: settings → theme picker (`themePicker`, `theme` action);
- avatar: profile → edit (`avpick` / `psave`);
- frame: achievements modal (`frame` action);
- title: profile → title picker (`tpick`);
- pet: the pet modal (`petpick`).

The shop keeps selling; it stops being the place where things are equipped.

Success: a player finds and changes any look item from one screen in two taps, sees the result before leaving,
and sees how to get anything locked.

## Entry

- `ui.screen = 'style'`, rendered by a new `styleHTML()` in the `!S` branch of `render()` (menu screens still use
  `innerHTML`; only the game board uses `morph`).
- Bottom nav (`h2nav`) gets a sixth button `data-a="style"` between ກາດ (book) and ຮ້ານ (shop). Icon: `UIC('style')`
  when `art/ui/style.webp` exists, else the 🎨 emoji (same fallback pattern as other nav icons). A prompt for the icon is
  added to `prompts/ui-home.txt`.
- At phone width six buttons must still fit: labels stay one word, button min width ≈ 56 px (check at 360 px).

## Layout (option A: preview + tabs)

```
┌ preview ───────────────────────────────┐
│ [avatar in frame] name  · title   🐾pet │   ← idCardHTML-like strip, live
│ [mini arena lane with deck pile + back] │   ← uses the chosen theme and back
├ tabs ──────────────────────────────────┤
│ ຫຼັງກາດ | ສະໜາມ | ຮູບ | ກອບ | ຊື່ສຽງ | ຄູ່ຫູ │
├ grid ──────────────────────────────────┤
│ tiles: ✓ in use · tap = use · 🔒 + how  │
└────────────────────────────────────────┘
```

- `ui.styleTab` remembers the tab (default `back`). The home «ຄູ່ຫູ» button opens the page on the `pet` tab.
- Desktop: preview on the left (sticky), tabs + grid on the right. Phone: preview on top, tabs scroll sideways.
- Tile states: in use (gold border + ✓), owned (tap to use), locked (dimmed, 🔒 badge, a one-line "how to get").
- Tapping a locked tile shows a small sheet: the item large, how to get it, and one button:
  shop item → «ໄປຮ້ານ» (opens shop on the cosmetics tab); achievement/level item → progress text («ອີກ 12 ເກມ»).

## Tabs: data and saving

| Tab | Items | Owned when | Use (save) |
|---|---|---|---|
| ຫຼັງກາດ `back` | default `BACK` + `PM_BACK_ART` keys | default always; others `pmOwned(id)` | `premium_equip(product_key, 'back')` (default = `''`); server checks ownership |
| ສະໜາມ `arena` | `THEMES` + `meteor` | themes always; meteor `pmOwned('arena-meteor')` | themes: `SET.theme`, `SET.meteor=false`, `saveSet()`; meteor: existing `theme`/`meteor` handler (sets theme, equips via `premium_equip`) |
| ຮູບໂປຣໄຟລ໌ `avatar` | `AVATARS()` | always | needs a profile: update `profiles.avatar` for the own row (same write `acctSave` does, name unchanged); guest without profile sees «ສ້າງຜູ້ຫຼິ້ນ» (opens the existing profile create flow) |
| ກອບຮູບ `frame` | `FRAMES` | `''` always; others when an `ACH` with that `frame` is done (same test as the achievements modal) | `col().frame`, `saveCol()`, `profPush()` |
| ຊື່ສຽງ `title` | `TITLES` | `titleHas(x, col())` | `col().title`, `saveCol()`, `profPush()` |
| ຄູ່ຫູ `pet` | `PETS` (show stage art via `petFace`) | always | `col().pet`, `saveCol()` (and the profile row's `pet` on next profile save, as today) |

Paid items keep using the server: the page never marks a paid item as in use until `premium_equip` returns.
While `PM.state` is not loaded (guest or still loading) paid tiles show as locked with «ເຂົ້າບັນຊີເພື່ອຊື້» or a spinner;
`premiumLoad()` is called when the page opens.

## Changes elsewhere

1. Shop cosmetics tab (`premiumShopHTML`, tab `cosmetics`): remove «ເລືອກໃຊ້ / ກຳລັງໃຊ້» and the two reset buttons.
   Owned items show «✓ ມີແລ້ວ · ໄປໃຊ້» which opens the customize page on the right tab. Buying stays as is; after a
   successful buy the toast offers «ໄປໃຊ້».
2. Settings: replace the «ໜ້າຕາສະໜາມ» section (`themePicker()`) with a «🎨 ປັບແຕ່ງ» link. During a game the settings
   modal keeps a compact arena picker (players change the board mid-game) but without the paid tile's shop jump.
3. Profile: «✏️ ແກ້ຊື່ ແລະ ຮູບ» edits the name only (avatar grid moves to the page); the profile-create flow for a new
   player keeps its avatar grid. «🎖️ ສະມັນຍາ» opens the page on the title tab. The achievements modal shows frames as
   rewards only (no picking).
4. Home «ຄູ່ຫູ» mini button opens the page on the pet tab; the pet modal is removed.

## Not in scope

- New cosmetic items or prices, server/SQL changes, card showcase («ກາດໂຊວ໌») picking (stays in the profile).
- The deck builder (part 2).

## Testing

- Every tab: tap owned → preview and home/game reflect it after reload; locked → sheet with the right action.
- Account with a mocked `PM.state` (`__dbg.pm`) and a guest; phone (412×870, 360 wide nav) and desktop (1280×800).
- Paid item not owned cannot be equipped (no `premium_equip` call is made; server would refuse anyway).
- Shop: owned item shows «ໄປໃຊ້»; buying still works with the existing flow.
- No console errors (`__errs` empty); `python3 tools/build-security.py` run after the script change.
