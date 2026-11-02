# ແຜນເກມ 3 ພາສາ (ລາວ · ອັງກິດ · ໄທ) · ⏳ ພັກໄວ້ · 02/11/2026

ເຈົ້າຂອງເກມ ຂໍໃຫ້ເກັບແຜນໄວ້ກ່ອນ. ຈະເລີ່ມ ເມື່ອເຈົ້າຂອງບອກວ່າພ້ອມ.

## ສິ່ງທີ່ຕ້ອງແປ (ນັບວັນທີ 02/11/2026)
- ຂໍ້ຄວາມພາສາລາວໃນ index.html: ປະມານ 3,100 ຂໍ້ຄວາມ (ປຸ່ມ, ເມນູ, ຄຳອະທິບາຍ, toast 116, log 133).
- ກາດ 365 ໃບ: name, skill, lore, tag (+ tf.name, KW_HELP, TALES, ຊື່ເດັກ, ຊື່ຂັ້ນແຣງ, ສະມັນຍາ, ຜົນງານ, ພາລະກິດ).
- cards.html (ໜ້າກາດທັງໝົດ), ອີເມວ Supabase (email-templates.md), ຂໍ້ຄວາມໃນຮ້ານ ແລະ ການຈ່າຍເງິນ.
- ບໍ່ຕ້ອງແປ: ຮູບກາດ (ບໍ່ມີໜັງສືໃນຮູບ), ໂລໂກ້ (ອັງກິດຢູ່ແລ້ວ), ສຽງພາກລາວ (ເກັບໄວ້ເປັນສີສັນ).

## ຂັ້ນຕອນ (ແຕ່ລະຂັ້ນ push ໄດ້ເລີຍ)
1. ລະບົບພາສາ + ອັງກິດ ໜ້າຈໍ: ປຸ່ມເລືອກ 🇱🇦 🇬🇧 🇹🇭 ໃນໜ້າເຂົ້າສູ່ລະບົບ ແລະ ຕັ້ງຄ່າ; ແປເມນູ ແລະ ປຸ່ມທັງໝົດ.
2. ກາດ 365 ໃບ ເປັນອັງກິດ + ບັນທຶກເຫດການໃນເກມ.
3. ພາສາໄທ ທັງໝົດ.
4. cards.html, ອີເມວ, ຂໍ້ຄວາມຮ້ານ.

## ໝາຍເຫດ
- ຊື່ຕົວລະຄອນ ແລະ ຄຳນິທານ: ໃຫ້ຄົນທີ່ຮູ້ພາສາອັງກິດ / ໄທ ກວດຄືນ.
- ອອນລາຍ ຂ້າມພາສາໄດ້ (ເກມໃຊ້ id ກາດ, ບໍ່ໃຊ້ຂໍ້ຄວາມ).
- ຫຼັງເຮັດແລ້ວ: ກາດ ຫຼື ປຸ່ມໃໝ່ທຸກອັນ ຕ້ອງມີ 3 ພາສາ.

## Technical notes (for the assistant)
- One table per language (`I18N.en`, `I18N.th`) keyed by the Lao source string, so untranslated text falls back to Lao;
  a `T('…')` helper around UI strings, `SET.lang` saved in settings, `<html lang>` updated.
- Card text: `C[id].name/skill/lore/tag` swapped from per-language card tables at load (`CARD_I18N[lang][id]`), never inside
  rules code. The secure engine (`engine.mjs`) logs in Lao on the server: translate log lines in the browser when shown.
- Lao fonts are Noto Sans Lao (Looped); add Noto Sans Thai for Thai. Check text length in buttons (English is longer).
- Keyword highlighting (`RULES` regexes over skill text) needs a set per language.
