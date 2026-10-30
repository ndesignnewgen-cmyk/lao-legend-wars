# ເອັບເຟັກກາດຕົວຫຼັກ 14–24 · 30/10/2026

ສາກເປີດຕົວໃໝ່ຄົບ 11 ເດັກ. ໃຊ້ຮູບກາດທີ່ມີຢູ່ ແລະລາຍເຄື່ອນໄຫວແຕ້ມດ້ວຍ SVG.
ມີວົງເງົາມືດສະເພາະຫຼັງຕົວລະຄອນ; ບໍ່ມີມ່ານດຳ/ຂາວເຕັມຈໍ, ບໍ່ສັ່ນຈໍ.

| ເດັກ | ກາດ | ສາກ | ສີ |
|---|---|---|---|
| 14 | ນາງຈຳປາ | ເສັ້ນດາບໄຂວ່ເປັນວົງ, ດອກຈຳປາ 5 ດອກບານລ້ອມ | ທອງອ່ອນ + ບົວ |
| 15 | ປູ່ລາງເຊີງ | ນ້ຳເຕົ້າສອງຂ້າງ, ເຄືອໄມ້ງອກ, ລູກຫຼານຄ່ອຍປາກົດ | ທອງອົບອຸ່ນ + ຂຽວ |
| 16 | ຂຸນເຈືອງ | ໄຫຫີນ 3 ໜ່ວຍຍົກຂຶ້ນ, ເສັ້ນແສງເຊື່ອມພື້ນ | ສີຫີນອົບອຸ່ນ + ຢົກ |
| 17 | ເຈົ້າຖ້ຳກອງລໍ | ຂອບຫີນຍ້ອຍ, ມະນີຄ່ອຍສ່ອງແສງ, ຄື້ນນ້ຳໃຕ້ດິນ | ຟ້າແກ້ວ + ມ່ວງ |
| 18 | ເຮືອຊ່ວງຄຳ | ເຮືອຫົວນາກທອງ, ໄມ້ແຈວ, ຄື້ນນ້ຳ 3 ຊັ້ນ | ທອງ + ຟ້ານ້ຳຂອງ |
| 19 | ແມ່ຄົວເຂົ້າໜຽວຄຳ | ກະຕິບຄຳ, ໄອອົບອຸ່ນ, ໃບຜັກຜຸດຂຶ້ນສອງຂ້າງ | ທອງນ້ຳເຜິ້ງ + ຂຽວ |
| 20 | ນາຍຮ້ອຍມວຍ | ເຊືອກເວທີເປັນເສັ້ນແສງ, ກຳປັ້ນພັນເຊືອກສອງຂ້າງ | ທອງ + ແດງອ່ອນ |
| 21 | ໄຮໂດຣນາກ | ກັງຫັນນ້ຳໝຸນ, ສາຍນ້ຳໂຄ້ງເຂົ້າວົງຈອນໄຟຟ້າ | ຢົກ + ຟ້າ |
| 22 | ປັນຍາຄຳ | ໃບລານເປີດ, ວົງຈອນຂີດຂຶ້ນຫາດາວ, ແສງປັນຍາ | ທອງ + ຟ້າໃສ |
| 23 | ບັ້ງໄຟດາວ-1 | ບັ້ງໄຟທະຍານ, ຫາງແສງ, ວົງໂຄຈອນໄຂວ່ | ທອງສົ້ມ + ຟ້າອະວະກາດ |
| 24 | ແມ່ໄກ່ດາວ | ປີກແສງປົກປ້ອງ, ດາວລູກ 7 ດວງຄ່ອຍເຊື່ອມເປັນກຸ່ມ | ທອງອ່ອນ + ມ່ວງລະມຸນ |

## ຮູບ

- ນາງຈຳປາໃຊ້ຮູບຕັດພື້ນເກົ່າ.
- ຕັດຮູບເດັກ 15–24 ຈາກຮູບເກົ່າແລ້ວ: ທຳມະດາ 10 + ອາດພິເສດ 10 ຮູບ. ທັງ 11 ເດັກໃຊ້ຕົວລະຄອນລອຍອອກມາແລ້ວ; ບໍ່ໃຊ້ຂອບຮູບ. ຂະໜາດ ແລະບັນທຶກຕັດຮູບຢູ່ legend-cutouts-14-24.json.
- ພຣ້ອມໃໝ່: `prompts/legend-effect-pieces.txt` ມີແຕ່ຮູບເສີມ 6 ຮູບ. ບໍ່ຕ້ອງເຈນຕົວລະຄອນໃໝ່.

## Implementation and validation

- `LEGEND_SCENES` supplies palette, Lao subtitle and accent sound; `legendScene` builds the eleven SVG motifs. Each is registered in the existing `LEGEND_FX` dispatch.
- `fxShowcase` uses the new local stage only for these eleven IDs. Existing thirteen legend recipes are preserved. Card costs, powers, timing of rule actions and rewards are unchanged.
- Every new visual is a descendant of its showcase; removal on completion or tap also removes its artwork and sparks. Accent sounds check that the parent remains connected. No new global particle emitters or asset requests are needed for the vector motifs.
- Full wait: 2.3 seconds; short: 1.265 seconds; off / system reduced motion: at most 120 ms of static presentation. Shape animation timing follows `--dur`. No shake or screen flash in these eleven scenes.
- Same function is called for normal games, local bot rendering and server-confirmed `showcase` animation frames. `tools/build-security.py` regenerates the server module and CSP.
- WebKit tests: 1280×800 and 390×844 each passed 337 assertions; 844×390 passed 348 assertions including alternate art. Covered all eleven legends in full/short/off, loaded pictures, in-bounds name bands, transparent stages, tap skip, cleanup, unchanged game state, and a mock server-confirmed showcase frame. No browser errors.
- Frame samples from a background WKWebView are throttled and do not establish phone FPS. Real-device smoothness and real-account server playback still need confirmation after deployment.
- Repro: serve the repo on localhost, compile `tools/wk.swift`, run it with `tools/legend-effects-test.js`. No remote writes or real credentials are required.
- Pending: optional effect-object art and its integration, commit/push when requested, and deployment using `sh tools/deploy-security.sh`.

## Cutout correction validation

After integrating the 20 cutouts, the mobile WebKit suite passed 417 assertions with no errors, including explicit checks that every new legend uses `.scut` rather than `.sfigure`. Desktop snapshots of all eleven scenes were inspected. Hydro Naga uses a local alpha fade at its source-art occlusion edge. Previous character-generation prompts are superseded by the six optional effect-object prompts.

## Generated effect pieces (completed)

The six optional objects were generated with the built-in image generation tool and are now integrated, rather than waiting for owner-generated art. PNG masters are under `art/fx/source/`; six 512px WebP runtime sprites are under `art/fx/`, about 300 KB total. `design/legend-effect-art.json` records source output filenames and the prompt-set location. They are preloaded through `preloadFx` and embedded as SVG images in the existing scene, sharing the same animation speed and cleanup lifecycle. Seven chick sprites use a separate foreground SVG layer so the mother hen cannot obscure them. No card rules or rewards changed.

Final painted-art validation: desktop 1280×800 and mobile 390×844 each passed 468 WebKit assertions with zero browser errors. Tests decode all six optimized images, check transparent corners and visible subjects, verify per-legend decoration counts, normal/alternate character cutouts, timing configuration, name-band bounds, immediate tap skip, cleanup and unchanged game state. All six affected main scenes were visually reviewed; the seven foreground chick sprites were also reviewed at phone size. PNG alpha was independently scanned for both transparent and visible pixels. Real-account deployment remains pending.

## Owner-selected reference: deck 5 (Phaya Thaen)

Owner rejected the original diagram-and-props presentation and selected the existing Phaya Thaen entrance as the reference. The revised 14–24 scenes reuse the painted card-art backdrop, foreground cutout proportions and broad lower name ribbon of that reveal. The central decorative dial and rounded caption panel are removed; extra subtitles are hidden. Props now drift in and fade, line work appears in short pulses, and parent-owned themed particles move through the stage. A local power glow supplies impact without a full-screen black/white overlay or shake. The smaller seven chick accents remain on the foreground layer. All visual nodes disappear with the showcase on skip; no gameplay rules changed.

Final reference-style validation: 556 assertions passed on each of 1280×800 and 390×844 WebKit, including the new painted backdrop, absence of the dial, full/short particle counts, no particles when off, cutout/asset loading, ribbon bounds, skip/cleanup and mock server animation frames. The localhost-only tools/effects-preview.html page exposes all 24 actual reveal functions with replay/loop/hold controls for owner review. Real-account deployment and final visual approval remain pending.

Visual approval received from the owner on 2026-10-30: “ok ງາມແລ້ວ”. The deck-5-based revision is the accepted design. Commit, push and deployment have not been performed.
