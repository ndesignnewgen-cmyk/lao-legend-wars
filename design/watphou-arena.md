# Vat Phou · Golden Light of Legends

Implemented 2026-10-30 from the owner's selected direction. This is a fantasy game illustration inspired by Vat Phou, not an architectural reconstruction.

- `watphou` is the starting arena. On the owner's subsequent request, older settings adopt it once (`arenaDefault: 'watphou-v2'`); all later player-selected themes persist normally. Other settings are preserved. All four themes remain available in settings.
- Painted sunset sanctuary, mountain, frangipani branches and sandstone terrace; pale gold player edge, copper opponent edge. Location cards still replace their lane background. Festivals retain their badges and gameplay, but their background image does not cover this scenery.
- A code-drawn engraved frangipani seal sits below the lanes. Legendary reveals briefly light the carving and add locally owned flower sprites. Skip removes the reveal and cancels the floor glow. Short mode uses five flowers; off/system reduced motion uses none.
- Full fusion uses golden links, a transparent stone doorway behind the resulting card, petals and a restrained gold ring. The board stays visible. Short fusion uses a small gate at the emerging card. The gate is preloaded with the theme. Compact landscapes reduce card/band size.
- A 68 BPM synthesized khaen score includes quiet wind and bird notes through the existing music bus. The theme replaces the normal battle music only during its matches; music/sound mute and volume controls apply. Legends use a shorter gong through the sound-effects bus.
- New generated masters and optimized WebP assets live in `art/arena/`; exact built-in image generation prompts are in `prompts/watphou-arena.txt`. Existing `art/fx/champa.webp` reused. Masters retained unchanged.
- `tools/arena-preview.html` is a localhost-only mock match using the actual game board and effects, with buttons to show the legend and fusion. No rewards or remote game writes.

Validation: WebKit 1440×900, 390×844 and 812×375; theme persistence, image alpha including doorway opening, full/short/off, local glow cleanup, unchanged game state, prior themes, audio levels and viewport fit. Eleven existing legend-entrance regressions also pass (556 checks). Syntax and whitespace checks pass. Rebuilt engine/CSP and refreshed the dashboard deployment bundle. No game rules or deck balance changed.

This theme is prepared locally; this task has not committed, pushed or deployed it.

## Owner-reference revision

The owner supplied `design/references/watphou-board-owner.png` and asked for that look. This supersedes the first sunset wallpaper treatment:

- Generated three separate reference-guided assets: a carved sandstone lane with gold/stone rim and frangipani corner ornaments, daylight temple surroundings and a framed parchment sidebar with a temple/pond footer. Optimized WebP copies are under `art/arena/*-v2.webp`; untouched PNG masters under `art/arena/source/`. Exact prompts in `prompts/watphou-arena-v2.txt`.
- Both lanes use the same calm stone surface; side names remain live Lao text and become quieter when cards occupy the lane. Location cards still show their own art. Each lane owns its summon-glow seal; both animations are cancelled on skip.
- Blue turn chip, ivory middle rail, pale side slots, burgundy opponent plate and brown player plate follow the supplied reference. Card frames and card art retain their existing meaning.
- The sidebar has its own scrollable reading area above the illustrated footer. Long skills remain reachable and the reading position survives redraws.
- The local preview starts with empty lanes and provides a button to place/remove sample cards, alongside the actual legend and fusion effects.
- WebKit checks: 65 desktop (1440×900), 61 portrait (390×844), 61 landscape (812×375), zero browser errors. Reviewed empty/occupied screenshots and the actual mobile preview. No gameplay/balance edits. Engine/CSP and dashboard bundle regenerated. Not committed or deployed.
