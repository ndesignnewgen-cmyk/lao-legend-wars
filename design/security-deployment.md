# ນຳລະບົບປ້ອງກັນໄປໃຊ້

30/10/2026: ຕິດຕັ້ງ secure-game ແລະ Run f15.sql ໃນ Supabase ສຳເລັດຜ່ານໜ້າເວັບ. ເວັບອັບເດດແລ້ວ ແລະ ລອງເລີ່ມເກມບອດຜ່ານ. ຍັງລໍລອງສອງບັນຊີ. ຂັ້ນຕອນລຸ່ມສຳລັບຕິດຕັ້ງຄືນ.

## ລຳດັບ
1. ສຳຮອງຖານຂໍ້ມູນກ່ອນ. Supabase → ໂຄງການ lao-legend-wars → Database → Backups. ກວດວ່າມີສຳຮອງທີ່ກູ້ໄດ້.
2. ຕິດຕັ້ງ Supabase CLI ຕາມ https://supabase.com/docs/guides/local-development/cli/getting-started . ເປີດ Terminal ໃນໂຟນເດີເກມ → ພິມ `sh tools/deploy-security.sh`. ເຂົ້າບັນຊີໃນໜ້າ Supabase ທີ່ເປີດຂຶ້ນ. ບໍ່ຕ້ອງສົ່ງລະຫັດລັບໃນແຊັດ.
3. ຫຼັງ commit/push ແລ້ວ ເປີດ SQL: https://raw.githubusercontent.com/ndesignnewgen-cmyk/lao-legend-wars/main/supabase/f15.sql
   Cmd+A → Cmd+C → Supabase → SQL Editor → New query → Cmd+V → Run.
   “Success. No rows returned” ແມ່ນສຳເລັດ. ຕ້ອງມີ f1–f14 ກ່ອນ.
4. ເປີດເວັບໃໝ່. ໃຊ້ 2 ບັນຊີທົດສອບ: ບອດ, ຫ້ອງໝູ່, ຈັບຄູ່, ເລືອກກາດ, ອອກແລ້ວກັບເຂົ້າ. ກວດວ່າຮັບລາງວັນໄດ້ຄັ້ງດຽວ.

SQL ຈະປິດວິທີຮັບລາງວັນ/ລາຍງານຜົນແບບເກົ່າ. ຜູ້ຫຼິ້ນຄວນຈົບເກມເກົ່າ ແລະ ເປີດເວັບໃໝ່. ຖ້າບໍ່ທັນຕິດຕັ້ງຝັ່ງ Supabase ການຫຼິ້ນຜ່ານບັນຊີຈະຍັງໃຊ້ບໍ່ໄດ້.

## ຕິດຕາມ
Supabase → Edge Functions → secure-game → Logs: ກວດຂໍ້ຜິດພາດ, ເວລາຕອບ ແລະ ຈຳນວນຄຳຂໍ. ຢ່າບັນທຶກລະຫັດເຂົ້າບັນຊີ ຫຼື ກາດໃນມືລົງໃນ Logs. ປັບແຈ້ງເຕືອນຄ່າໃຊ້ຈ່າຍໃນໜ້າ Billing ຂອງໂຄງການ.

ການຈຳກັດໃນເກມບໍ່ປ້ອງກັນການຍິງຄຳຂໍຈຳນວນຫຼາຍທັງໝົດ. ການປ້ອງກັນໜ້າເວັບລະດັບໂດເມນ ຕ້ອງຕັ້ງຄ່າກັບຜູ້ໃຫ້ບໍລິການ; ຍັງບໍ່ໄດ້ປ່ຽນ DNS ໃນວຽກນີ້. ຢ່າປ່ຽນ DNS ກ່ອນຈົດຄ່າເກົ່າ.

## ຖ້າມີບັນຫາ
ຢຸດຮັບເກມໃໝ່ຊົ່ວຄາວ, ເກັບຂໍ້ຜິດພາດທີ່ບໍ່ມີຄວາມລັບ, ແກ້ແລ້ວ deploy ຄືນ. ບໍ່ຄວນເປີດລະບົບລາງວັນເກົ່າຄືນ ເພາະຍັງປອມຜົນໄດ້. ການກູ້ຖານຂໍ້ມູນຈາກສຳຮອງອາດເສຍຂໍ້ມູນໃໝ່; ຕ້ອງເຈົ້າຂອງເປັນຜູ້ຕັດສິນ.

## ອັບເດດ secure-game ຜ່ານໜ້າເວັບ · 30/10/2026
ຖ້າບໍ່ໃຊ້ Terminal: ເປີດ https://raw.githubusercontent.com/ndesignnewgen-cmyk/lao-legend-wars/main/supabase/secure-game-deploy.txt → Cmd+A → Cmd+C → Supabase → ໂຄງການ lao-legend-wars → Edge Functions → secure-game → Code → index.ts → ຄລິກໃນໂຄດ → Cmd+A → Cmd+V → Deploy updates. ໄຟລ໌ນີ້ລວມໂຄດໄວ້ແລ້ວ ແລະບໍ່ມີລະຫັດລັບ. ບໍ່ຕ້ອງສ້າງ SQL ໃໝ່ສຳລັບອັບເດດນີ້. ໃຫ້ເຈົ້າຂອງເປັນຜູ້ກົດ Deploy; ບໍ່ສົ່ງລະຫັດລັບໃນແຊັດ.
