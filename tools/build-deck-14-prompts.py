#!/usr/bin/env python3
"""Readable UTF-8 prompt sheets with one copy button per sound."""
from pathlib import Path
import html, json

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'outputs/deck-14-cute-school-v4/sfx'
rows=json.loads((ROOT/'design/deck-14-audio.json').read_text(encoding='utf-8'))
assert len(rows)==11
css='''*{box-sizing:border-box}body{margin:0;background:#111e2e;color:#fff0d1;font:16px/1.8 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:24px}h1{font-size:clamp(24px,4vw,34px);color:#f2ce8a}h2{font-size:20px;margin:0}p{color:#d1d5db}a{color:#ffe0a3}nav{display:flex;flex-wrap:wrap;gap:18px}.steps,article{border:1px solid #69747e;background:#1c2d40;border-radius:16px;padding:20px;margin-top:20px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.65 ui-monospace,monospace;background:#101e2c;color:#e1e6ee;border-radius:10px;padding:15px}button{font:700 16px system-ui;cursor:pointer;border:0;border-radius:24px;padding:11px 20px;background:#edc879;color:#192535}button:hover{background:#ffe3a9}code{overflow-wrap:anywhere;color:#d3dbe5}small{display:block;color:#bbc8d4}.feedback{min-height:1.8em;display:block;color:#a8e5c5;margin-top:8px}.actions{display:flex;gap:10px;flex-wrap:wrap}.file{background:#344b60;color:#f4e6c9}@media(max-width:700px){main{padding:16px}.grid{grid-template-columns:1fr;gap:0}article,.steps{padding:16px}pre{font-size:14px}}'''
script='''document.querySelectorAll('button[data-copy]').forEach(b=>b.onclick=async()=>{const t=document.getElementById(b.dataset.copy).textContent,status=b.closest('article').querySelector('.feedback');try{try{await navigator.clipboard.writeText(t);}catch(e){const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;left:0;top:0;opacity:0';document.body.append(a);a.select();a.setSelectionRange(0,a.value.length);const copied=document.execCommand('copy');a.remove();if(!copied)throw Error('copy unavailable');}status.textContent=b.classList.contains('file')?'✓ ກັອບຊື່ໄຟລ໌ແລ້ວ':'✓ ກັອບພຣອມແລ້ວ — ເອົາໄປວາງໃນ ElevenLabs ໄດ້';}catch(e){const s=getSelection(),r=document.createRange();r.selectNodeContents(document.getElementById(b.dataset.copy));s.removeAllRanges();s.addRange(r);status.textContent='ເລືອກຂໍ້ຄວາມໃຫ້ແລ້ວ — ກົດ Cmd+C ເພື່ອກັອບ';}});'''

def page(back,txt):
    parts=['<!doctype html><html lang="lo"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ພຣອມສຽງ 11 ແບບ · ເດັກ 14</title><style>'+css+'</style></head><body><main><h1>⚔ ພຣອມສຽງ · ນັກດາບສາວ</h1><p>11 ແບບ ສຳລັບເຈນໃນ ElevenLabs</p><nav><a href="'+back+'">ຟັງສຽງຕົວຢ່າງ</a><a href="'+txt+'" download>ດາວໂຫຼດພຣອມທັງໝົດ</a></nav><div class="steps">1. ກົດ «ກັອບພຣອມ» ຂອງສຽງທີ່ຈະເຈນ.<br>2. ວາງພຣອມໃນ ElevenLabs ສ່ວນ Sound Effects ແລ້ວເຈນແຍກເທື່ອລະສຽງ.<br>3. ບັນທຶກຊື່ໄຟລ໌ຕາມທີ່ຂຽນໄວ້ ແລ້ວສົ່ງກັບມາ.<small>ປຸ່ມກັອບພຣອມຈະກັອບສະເພາະຄຳອະທິບາຍພາສາອັງກິດ.</small></div><div class="grid">']
    for i,r in enumerate(rows,1):
        pid='prompt-'+r['id'];fid='file-'+r['id']
        duration=r.get('requestedDuration',r['duration'])
        status='<small>✓ ໃສ່ສຽງ ElevenLabs ຂອງເຈົ້າແລ້ວ</small>' if r.get('source','').startswith('ElevenLabs') else ''
        parts.append('<article><h2>'+str(i)+'. '+html.escape(r['name'])+'</h2>'+status+'<small>ຄວາມຍາວທີ່ແນະນຳ: '+str(duration)+' ວິນາທີ</small><code id="'+fid+'">blade-'+r['id']+'.mp3</code><pre id="'+pid+'">'+html.escape(r['prompt'])+'</pre><div class="actions"><button data-copy="'+pid+'">ກັອບພຣອມ</button><button class="file" data-copy="'+fid+'">ກັອບຊື່ໄຟລ໌</button></div><span class="feedback" role="status" aria-live="polite"></span></article>')
    parts.append('</div></main><script>'+script+'</script></body></html>')
    return '\n'.join(parts)

for path,back,txt in [(ROOT/'prompts/deck-14-sfx-elevenlabs.html','../tools/deck-14-sfx.html','deck-14-sfx-elevenlabs.txt'),(OUT/'ELEVENLABS-PROMPTS.html','../index.html','ELEVENLABS-PROMPTS.txt')]:
    path.write_text(page(back,txt),encoding='utf-8')
# Plain-text files need a BOM because the basic local HTTP server sends no charset.
for path in [ROOT/'prompts/deck-14-sfx-elevenlabs.txt',OUT/'ELEVENLABS-PROMPTS.txt']:
    path.write_text(path.read_text(encoding='utf-8-sig'),encoding='utf-8-sig')
print('Created 11 UTF-8 prompt cards and repaired both plain-text encodings')
