# ຮ້ານຕຳນານ · ເພັດພິເສດ

ຄຳຂໍເຈົ້າຂອງ 30/10/2026 ອະນຸມັດຊື້ເພັດດ້ວຍເງິນແທ້, ໃຊ້ BCEL One / OnePay ແລະແລກເພັດພິເສດເປັນເພັດໃນເກມ. ຄຳຂໍນີ້ແທນຂໍ້ກຳນົດເກົ່າ «ບໍ່ມີເງິນແທ້» ສະເພາະຮ້ານນີ້.

## ຮູບແບບ

- ພື້ນສີຄີມ, ສີຄາມ, ຂອບຄຳ. ຫີບມີລາຍນາກ/ຜ້າລາວ; ເພັດສີຟ້າໃນກອບນາກຄຳ.
- ເຈນໂດຍ image_gen ຄົບ 2 ຮູບ. PNG ຕົ້ນສະບັບ ແລະ WebP ຢູ່ `art/ui/premium-{chest,gem}*`. ພຣ້ອມຢູ່ `prompts/premium-shop-art.txt`.
- ຫຼັງກາດ 3 ລາຍເປັນຮູບເຈນຈິງໃນ `art/backs/`: ນາກຄຳ, ຜ້າຊິ່ນ ແລະດວງດາວ; ໂລໂກ້ເກມຢູ່ກອບນ້ອຍດ້ານລຸ່ມ. ພຣ້ອມຢູ່ `prompts/premium-card-backs.txt`. ສະໜາມຝົນດາວຕໍ່ຍອດຈາກທົ່ງໄຫຫີນຟຣີ. ບໍ່ປ່ຽນພະລັງກາດ.
- ປຸ່ມຊື້/ແລກມີໜ້າຢືນຢັນ, ຍອດຈ່າຍ ແລະຍອດທີ່ໄດ້. ໜ້າຕ່າງຕາມຕີມ; ພື້ນນອກໃສ.

## ລາຄາທີ່ກຽມ

| ກີບ | ເພັດພິເສດ |
|---:|---:|
| 10,000 | 100 |
| 30,000 | 330 |
| 50,000 | 575 |
| 100,000 | 1,200 |

ແລກທາງດຽວ 100 ເພັດພິເສດ → 500 ເພັດໃນເກມ. ຫຼັງກາດ 100/150/200; ສະໜາມຝົນດາວ 800; ຊຸດລວມ 1,000. ຖ້າມີບາງຊິ້ນແລ້ວ ຊຸດລວມຄິດລາຄາຕາມສັດສ່ວນຂອງທີ່ຍັງບໍ່ມີ.

## ການຮັບເງິນ

1. ລູກຄ້າເຂົ້າບັນຊີ → ເລືອກແພັກ → ຢືນຢັນຜູ້ຊຳລະ/ຜູ້ປົກຄອງ → ໄດ້ບິນຈາກເຊີບເວີ.
2. ບິນເກັບລາຄາ, ຈຳນວນເພັດ ແລະຜູ້ຮັບ/QR ໃນເວລາສ້າງ. ຈ່າຍແລ້ວສົ່ງເລກອ້າງອີງໃຫ້ຮ້ານ.
3. ຜູ້ດູແລກວດເງິນເຂົ້າຈິງໃນ BCEL → ໃສ່ເລກລາຍການທີ່ກວດແລ້ວ → ອະນຸມັດ. ບິນຈາກລູກຄ້າຢ່າງດຽວບໍ່ເພີ່ມເພັດ.
4. ບິນທີ່ໝົດເວລາບໍ່ສະແດງ QR ເພື່ອຈ່າຍໃໝ່; ຄົນທີ່ຈ່າຍແລ້ວຍັງສົ່ງເລກອ້າງອີງໃຫ້ກວດໄດ້.

ຮອບທຳອິດເປັນການກວດເງິນດ້ວຍຜູ້ດູແລ. ຍັງບໍ່ມີການຕໍ່ OnePay ອັດຕະໂນມັດ. ບໍ່ສ້າງ QR ທະນາຄານປອມ.

## ຄວາມຖືກຕ້ອງ

Server-only special wallet, ownership and prices; RLS, no direct client writes, revoked internal helpers. Atomic debit/credit and durable ledger. Per-user wallet lock serializes spending. Persisted client retry UUIDs survive reload; reuse after uncertain replies. Approved bank references are unique across all buyers; customer-entered references do not reserve them. Topup approval retries credit once through locked order status + unique ledger order ID. Paid balances are never imported from browser saves. Public storage contains only merchant QR artwork, admin uploads only; no bank/API secrets.

## ກ່ອນເປີດຮັບເງິນຈິງ

ຮອບນີ້ຢູ່ໃນເຄື່ອງ. ຍັງບໍ່ commit/push/deploy ຫຼືແລ່ນ SQL ໃນ Supabase ຈິງ.

- ອັບເດດເວັບ ແລະໂຄດເກມຝັ່ງ Supabase ພ້ອມກັນ (engine ສ້າງຄືນຈາກ index.html).
- ເຈົ້າຂອງແລ່ນ `supabase/f17.sql` ຮຸ່ນທີ່ມີ amount_qrs ຫຼັງ F1–F16. ຫຼັງອັບຂຶ້ນ GitHub ຈຶ່ງໃຫ້ລິ້ງ raw ທີ່ເປີດໄດ້ຈິງ.
- ເຂົ້າເກມດ້ວຍບັນຊີຜູ້ດູແລ → ຕັ້ງຄ່າ → ຜູ້ດູແລ → ເຕີມເພັດ → ໃສ່ຊື່ຜູ້ຮັບໃຫ້ກົງກັບ BCEL → ເລືອກຮູບ QR ຂອງຮ້ານ → ຕິກເປີດຮັບ → ບັນທຶກ.
- ຈົນກວ່າຈະມີຊື່ຜູ້ຮັບ ແລະ QR ຈິງ ປຸ່ມເຕີມຍັງປິດຢູ່.

## ທົດລອງ

`python3 -m http.server 8124 --bind 127.0.0.1` → http://localhost:8124/tools/shop-preview.html. ຍອດທົດລອງຢູ່ຄົນລະທີ່ກັບເກມຫຼັກ port 8123. ບໍ່ຮັບເງິນ ແລະບໍ່ຕໍ່ Supabase ຈິງ.

- `tools/premium-db-test.sql`: disposable Postgres with auth/storage/wallet fixtures, privileges, canonical prices, one-way exchange, idempotence, owned-item/bundle pricing, merchant setup, order lifecycle, duplicate bank rejection and RLS.
- Additional two-session test: concurrent identical retries credit once; concurrent different spends cannot overdraw.
- `tools/premium-ui-test.js`: 42 checks on desktop and mobile, actual shop buttons with mock server, including a lost debit reply and retry.
- `tools/premium-board-test.js`: bundle/equip and actual game board render; my card back and meteor theme; opponent backs preserved.

ສະຖານະ QR ໃໝ່: ອ່ານ `design/payment-qr-amounts.md`. ຮອບທີ 2 ປ່ຽນ method 01 ເປັນ 12 ແລະເຈົ້າຂອງຢືນຢັນຊື່/ຍອດ 10,000 ກີບໃນ BCEL One ແລ້ວ. ກຽມຮູບ v2 ຄົບ 4 ແພັກໃນ `art/payments/`; ການເລືອກ QR ຕາມລາຄາເຮັດຢູ່ເຊີບເວີ. ຍັງລໍອັບເວັບ/F17 ແລະຕັ້ງຄ່າຮ້ານຈິງ.
