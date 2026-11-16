# One Piece · ຕົວທົດລອງຄຳອະທິບາຍລາວ

2026-11-16 · ເຈົ້າຂອງເລືອກ Luffy ແລະ Zoro ເປັນຊຸດທຳອິດ.

- ເປີດ `/onepiece/` ຈາກເຊີບເວີໃນເຄື່ອງ.
- ມີ 9 ກາດ: ST01-001, OP01-001, ST01-012, ST01-013, ST01-004, ST01-006, ST01-007, ST01-014, ST01-015.
- ຮູບກາດເດີມ ແລະຄຳອະທິບາຍລາວແຍກກັນ. ຊອກຊື່, ລະຫັດ, ຄວາມສາມາດ ແລະກັ່ນຕາມປະເພດໄດ້.
- ບົດຝຶກໃຊ້ສະຖານະທີ່ກຳນົດໄວ້: DON!!, Rush, Blocker, Counter, Trigger, K.O. ແລະຜົນທີ່ໝົດເວລາ.
- ຍັງບໍ່ມີກອງກາດ 50 ໃບ, ບອດເຕັມເກມ, ອອນລາຍ ຫຼືການຈັດຊຸດກາດ.
- ຮູບກາດເດີມ 9 ໃບເກັບຢູ່ `onepiece/cards/` ພ້ອມລິ້ງຕົ້ນສະບັບແລະ SHA-256 ໃນ `sources.json`. ຟອນໂຫຼດຈາກ Google ແລະມີຟອນສຳຮອງໃນເຄື່ອງ.
- ນຳຮູບແສງຈາກ `art/fx/` ມາໃຊ້ຊ້ຳ: target-ring, dust-ring, blade-silver-arc, beam-slash, drum-shield. ປັບວິທີເຄື່ອນຈາກ `fxRing` / `fxLunge` ໃນເກມເດີມ. ບໍ່ມີແສງປິດເຕັມຈໍ ຫຼືສັ່ນໜ້າຈໍ.
- ເພີ່ມສຽງເດີມ 15 ໄຟລ໌ຈາກ `art/sfx/`: click, flip, draw, play, attack, hit, bless, blade-focus, blade-slash, blade-guard, spell, destroy, reveal, foeturn, endturn. ສຽງຊົນຕາມຫຼັງຈັງຫວະພຸ່ງໂຈມຕີ. ເພີ່ມຮູບ rays, sparks ແລະ blade-twin-arc.
- ປຸ່ມສຽງໃນແຖບເທິງ, ແຖບປັບລະດັບ ແລະປຸ່ມລອງສຽງຢູ່ກ່ອນສະໜາມຝຶກ. ຈື່ຄ່າໄວ້ໃນ `op-trial-sound-v1`. ເລີ່ມສຽງຫຼັງການແຕະ ຫຼືກົດປຸ່ມ; ປິດສຽງແລ້ວຢຸດທັງສຽງທີ່ດັງແລະສຽງທີ່ລໍຖ້າ. ສະຫຼັບໄປໜ້າອື່ນກໍຢຸດສຽງ.
- ໄຟລ໌ໃໝ່ບໍ່ເຊື່ອມບັນຊີ, ການຈ່າຍເງິນ ຫຼືຂໍ້ມູນເກມ Lao Legend Wars.

## ແຫຼ່ງຂໍ້ມູນ

Checked 2026-11-16. Lao explanations are short teaching summaries; exact current official rulings take precedence. This local trial makes no claim of authorization to distribute Bandai artwork or publish a full One Piece game.

- [ST-01 card list](https://en.onepiece-cardgame.com/cardlist/?series=569001): stats, current effect text and Trigger descriptions.
- [OP-01 card list](https://en.onepiece-cardgame.com/cardlist/?series=569101): OP01-001 Zoro Leader.
- [ST-01–04 Q&A](https://en.onepiece-cardgame.com/pdf/qa_st-01-st-04.pdf?20240405=): rested DON cannot be moved from another Character; Nami may target herself; ST01-013's ability works during both players' turns; Jet Pistol checks current power; Luffy's Blocker prevention is per battle.
- [OP-01 Q&A](https://asia-en.onepiece-cardgame.com/pdf/qa_op01.pdf?20230728=): Zoro Leader does not stack per attached DON and affects Characters played later.
- [Official rule manual](https://en.onepiece-cardgame.com/pdf/rule_manual.pdf): normal DON power applies only during its owner's turn; battle and Trigger timing.
- [Bandai intellectual property notice](https://en.onepiece-cardgame.com/news/02_382.html).

## Verification

Pure teaching-rule regression: `tools/onepiece-test.js`, run in JavaScriptCore or the browser. Covers cost payment, rejected actions, once-per-turn limits, ability thresholds, power timing, defensive choices, Trigger branches, target legality and all reachable lesson states.

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -e 'var window={}; load("onepiece/lesson.js"); load("tools/onepiece-test.js"); print(JSON.stringify(runOnePieceTests(window.OPLesson)))'
```

Verified in Safari/WebKit at 1360×1060 and 390×844: nine card images load, search by ID and Leader filter work, Luffy attack and Guard Point Counter work through UI controls, reset restores state, no horizontal overflow. Normal-motion mobile checks confirm action locks release and all temporary effect nodes/card animations clean up. JavaScriptCore: 29 regression checks and 46 reachable lesson states passed. Asset source hashes and five reused local effect files verified.

SFX update: `tools/onepiece-audio-test.js` passed 47 checks in Safari. All 15 original AAC recordings decoded and rendered through the production playback bus into OfflineAudioContext with audible, non-clipping output at the default volume (peaks 0.147–0.359). Verified cue selection, delayed impact cancellation on mute, zero-volume silence, voice cleanup, hidden-page silence, controls and separate preference persistence. `tools/onepiece-animation-test.js` passed all 10 mobile checks after the additional sprites; original 29 lesson-rule checks still pass. The audio playback code adapts `sfxfLoad`/`sfxf` from the main game, with a small tone fallback during loading. No original art/sfx files or main engine files were changed.
