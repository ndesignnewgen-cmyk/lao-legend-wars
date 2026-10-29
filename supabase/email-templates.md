# Lao Legend Wars · email templates (Supabase > Authentication > Emails > Templates)

The game asks for the 6-digit code, so every template shows `{{ .Token }}` big. Paste the subject into "Subject" and the
HTML into "Message body" (switch the editor to HTML/Source if it shows rich text), then Save. Sent through Resend from
noreply@laolegendwars.com (SMTP settings: smtp.resend.com, port 465, user `resend`, password = Resend API key).

## Change Email Address (used when a player sets their email)

Subject:

```
ລະຫັດຢືນຢັນອີເມວ Lao Legend Wars: {{ .Token }}
```

Message body:

```html
<div style="font-family:'Noto Sans Lao',Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1b1426;color:#fff;border-radius:16px;text-align:center">
  <h2 style="margin:0 0 8px;color:#ffd23d">⚔️ ສົງຄາມຕຳນານລາວ</h2>
  <p style="margin:0 0 16px">ໃສ່ລະຫັດນີ້ໃນເກມ ເພື່ອຢືນຢັນອີເມວ {{ .NewEmail }}</p>
  <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#ffe48a;background:#0006;border-radius:12px;padding:14px 0;margin:0 0 16px">{{ .Token }}</div>
  <p style="margin:0;color:#c9bfd9;font-size:13px">ລະຫັດໃຊ້ໄດ້ 1 ຊົ່ວໂມງ. ຖ້າເຈົ້າບໍ່ໄດ້ຂໍ ບໍ່ຕ້ອງເຮັດຫຍັງ.</p>
  <p style="margin:8px 0 0;color:#8f86a3;font-size:12px">Your Lao Legend Wars email code: {{ .Token }}</p>
</div>
```

## Reset Password (used by "ລືມລະຫັດຜ່ານ?")

Subject:

```
ລະຫັດຕັ້ງລະຫັດຜ່ານໃໝ່ Lao Legend Wars: {{ .Token }}
```

Message body:

```html
<div style="font-family:'Noto Sans Lao',Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1b1426;color:#fff;border-radius:16px;text-align:center">
  <h2 style="margin:0 0 8px;color:#ffd23d">⚔️ ສົງຄາມຕຳນານລາວ</h2>
  <p style="margin:0 0 16px">ໃສ່ລະຫັດນີ້ໃນເກມ ແລ້ວຕັ້ງລະຫັດຜ່ານໃໝ່</p>
  <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#ffe48a;background:#0006;border-radius:12px;padding:14px 0;margin:0 0 16px">{{ .Token }}</div>
  <p style="margin:0;color:#c9bfd9;font-size:13px">ລະຫັດໃຊ້ໄດ້ 1 ຊົ່ວໂມງ. ຖ້າເຈົ້າບໍ່ໄດ້ຂໍ ບໍ່ຕ້ອງເຮັດຫຍັງ, ລະຫັດຜ່ານເກົ່າຍັງໃຊ້ໄດ້.</p>
  <p style="margin:8px 0 0;color:#8f86a3;font-size:12px">Your Lao Legend Wars password reset code: {{ .Token }}</p>
</div>
```
