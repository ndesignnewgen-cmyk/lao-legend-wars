#!/usr/bin/env python3
"""Package the current jacket-free, individual-face katana artwork only."""
from pathlib import Path
import hashlib, html, json, shutil, struct, zipfile

repo=Path(__file__).resolve().parent.parent
root=repo/'outputs/deck-14-cute-school-v4'
jobs=json.loads((root/'generation-jobs.json').read_text())['jobs']
names={j['id']:j['name'] for j in jobs}
names.update(khudapphen='ຄູ່ດາບເດືອນເພັງ',champathong='ເທວີດາບຈຳປາທອງ')
cards=list(names)+['alt-champathong']
cuts=['cut-'+x for x in ['nangchampa','dapsongmue','ajandap','khudapphen','champathong','alt-champathong']]
sections={'cards':cards,'cutouts':cuts,'box':['box-d14']}
assert len(cards)==18 and len(cuts)==6
rows=[]
for section,ids in sections.items():
    for ident in ids:
        p=root/(ident+'.png');b=p.read_bytes()
        assert b[:8]==b'\x89PNG\r\n\x1a\n'
        w,h=struct.unpack('>II',b[16:24])
        base=ident.removeprefix('cut-').removeprefix('alt-')
        name=names.get(base,'ກ່ອງເດັກ 14')
        if 'alt-' in ident:name+=' · ອາດພິເສດ'
        if ident.startswith('cut-'):name+=' · ໄດຄັດ'
        prompt=root/'prompts'/(ident+'.txt')
        assert prompt.exists(),ident
        rows.append(dict(id=ident,name=name,section=section,file=p.name,prompt=str(prompt.relative_to(root)),width=w,height=h,bytes=len(b),sha256=hashlib.sha256(b).hexdigest()))
assert len(rows)==25 and len({r['sha256'] for r in rows})==25
assert not (root/'NOT-FOR-IMPORT.md').exists(), 'Rejected art must not be packaged.'
alpha=json.loads((root/'alpha-check.json').read_text())
assert len(alpha)==6 and all(r['transparent']>0 and r['opaque']>0 for r in alpha)
fx=json.loads((root/'fx/manifest.json').read_text())
sounds=json.loads((root/'sfx/manifest.json').read_text())
assert len(fx)==6 and len(sounds)==11
owner_audio=all(r.get('source','').startswith('ElevenLabs') for r in sounds)
voice_scripts=json.loads((repo/'design/deck-14-voices.json').read_text()) if (repo/'design/deck-14-voices.json').exists() else []
voices=[r for r in voice_scripts if r.get('status')=='installed']
for r in sounds:shutil.copy2(repo/r['file'],root/'sfx'/Path(r['file']).name)
revision='special-transformation-v7' if (root/'SPECIAL-TRANSFORMATION-PROMPTS.txt').exists() else 'fusion-fantasy-v6'
(root/'MANIFEST.json').write_text(json.dumps(dict(version=4,artRevision=revision,mode='built-in imagegen',count=31,images=rows,effects=fx,sounds=sounds,voices=voices),ensure_ascii=False,indent=2))
requirements='''ເດັກ 14 · ນັກດາບສາວມໍປາຍ · ຮອບແກ້ v4

ຕາມຄຳແກ້ຂອງເຈົ້າຂອງ:
1. ຮັກສານັກຮຽນສາວມໍປາຍ ແລະໂຮງຮຽນລາວຍຸກປະຈຸບັນ.
2. ເອົາແຈັກເກັດອອກ: ເສື້ອນັກຮຽນຂາວ, ສິ້ນລາວ, ເກີບນັກຮຽນ/ເກີບຜ້າໃບ.
3. ແຕ່ລະຄົນມີໂຄງໜ້າ, ຮູບຕາ, ຊົງຜົມ ແລະບຸກຄະລິກຂອງຕົນເອງ.
4. ດາບຍີ່ປຸ່ນຄາຕານະ; ດາບຄູ່ໃຊ້ດາບຍາວ–ສັ້ນ; ດາບຝຶກເປັນດາບໄມ້.
5. ປັບຄວາມລະອຽດ ແລະແສງເງົາຕາມນາງຕານີ; ບໍ່ຄັດລອກໜ້າຕາ ຫຼືຊຸດນາງຕານີ.
6. ໃບໜ້າສາວມໍປາຍອານິເມະໜ້າຮັກ, ໜ້າອ່ອນໄວ, ຕາສົດໃສ; ອາຈານເປັນຜູ້ໃຫຍ່ຕາມບົດບາດ.
7. ທ່າດາບເຄື່ອນໄຫວ ແລະມຸມກ້ອງສະຫຼຽງມີມິຕິ; ບໍ່ໃຊ້ໜ້າຄົນແທ້ ຫຼືສັດສ່ວນຜູ້ໃຫຍ່ກັບນັກຮຽນ.
8. ເທວີດາບຈຳປາທອງປັບໃໝ່ v6: ໜ້າ/ຜົມມີເອກະລັກຂອງຮ່າງຮ່ວມ, ຊຸດແຟນຕາຊີງາຊ້າງ–ຄາມປະດັບຄຳ/ເງິນ ດັດແປງຈາກຊຸດຂອງນາງຈຳປາ/ສາວດາບສອງມື. ທ່າໃໝ່ເຫັນຂາ/ເກີບທັງສອງຂ້າງຄົບ.
'''
all_prompts=requirements+'\n\n'+'\n\n'.join('['+r['id']+']\n'+(root/r['prompt']).read_text() for r in rows)
if revision=='special-transformation-v7':
    requirements+='9. ອາດພິເສດ v7 ເປັນສາກແປງຮ່າງລະອຽດແບບນາງຕານີ: ດອກຈຳປາແກ້ວ, ແສງເດືອນ, ສາຍພະລັງຄຳ–ເງິນ; ຮັກສາໜ້າ/ຊຸດເທວີດາບ ແລະຂາສອງຂ້າງ.\n'
    all_prompts=requirements+'\n\n'+'\n\n'.join('['+r['id']+']\n'+(root/r['prompt']).read_text() for r in rows)
all_prompts+='\n\n'+'\n\n'.join('['+r['id']+']\n'+(root/'fx/prompts'/(r['id']+'.txt')).read_text() for r in fx)
if (root/'FUSION-FANTASY-PROMPTS.txt').exists():all_prompts+='\n\n'+(root/'FUSION-FANTASY-PROMPTS.txt').read_text(encoding='utf-8-sig')
if (root/'SPECIAL-TRANSFORMATION-PROMPTS.txt').exists():all_prompts+='\n\n'+(root/'SPECIAL-TRANSFORMATION-PROMPTS.txt').read_text(encoding='utf-8-sig')
(root/'PROMPTS.txt').write_text(all_prompts)
(repo/'prompts/deck-14-katana-remake.txt').write_text(all_prompts)
(root/'README.md').write_text(requirements+'''
ຮູບ PNG ແຍກ 25 ຮູບ: ຮູບກາດ 17, ອາດພິເສດ 1, ໄດຄັດໂປ່ງໃສ 6 ແລະກ່ອງ 1.
ຮູບເອັບເຟັກໂປ່ງໃສອີກ 6 ຮູບ ຢູ່ fx/.
ສຽງ SFX 11 ແບບ ຢູ່ sfx/: WAV ຕົ້ນສະບັບ + M4A ສຳລັບເກມ.
ສຽງຊຸດນີ້ສ້າງໃນເຄື່ອງ; sfx/ELEVENLABS-PROMPTS.txt ມີພຣອມສຳລັບເຈນສຽງປ່ຽນໃໝ່.
ເປີດ index.html ເພື່ອເບິ່ງຮູບ; ກົດຮູບເພື່ອເບິ່ງ PNG ຕົ້ນສະບັບ.
PROMPTS.txt ແລະ prompts/ ແມ່ນພຣອມທີ່ໃຊ້ຈິງ; MANIFEST.json ແມ່ນລາຍການໄຟລ໌.
ບໍ່ລວມຮູບຮອບຍ້ອນຍຸກ ຫຼືແຈັກເກັດທີ່ຄັດອອກ.
ໃສ່ຮູບໃໝ່ໃນເກມທີ່ລອງໃນເຄື່ອງ; ຍັງບໍ່ອັບເວັບ.
''')
if owner_audio:
    readme=root/'README.md'
    readme.write_text(readme.read_text().replace('WAV ຕົ້ນສະບັບ + M4A ສຳລັບເກມ.','WAV ທີ່ປັບແລ້ວ + M4A ສຳລັບເກມ; MP3 ຕົ້ນສະບັບໃນ sfx/owner-originals/.').replace('ສຽງຊຸດນີ້ສ້າງໃນເຄື່ອງ;','ສຽງ ElevenLabs ຂອງເຈົ້າ 11 ໄຟລ໌ ໃສ່ໃນເກມແລ້ວ;'))
if voices:
    (root/'voice').mkdir(exist_ok=True)
    shutil.copy2(repo/'prompts/deck-14-voices.txt',root/'voice/VOICE-PROMPTS.txt')
    (root/'voice/scripts.json').write_text(json.dumps(voice_scripts,ensure_ascii=False,indent=2))
    readme=root/'README.md';readme.write_text(readme.read_text()+'\nສຽງພາກລາວຂອງເຈົ້າ '+str(len(voices))+'/6 ບົດ ຢູ່ voice/: M4A, WAV ທີ່ປັບແລ້ວ ແລະຕົ້ນສະບັບ owner-originals/.\n')
css='''*{box-sizing:border-box}body{margin:0;background:#111c2b;color:#f5e5c9;font:16px/1.7 system-ui,sans-serif}main{max-width:1500px;padding:25px;margin:auto}h1{color:#f0c67e;font-size:30px}h2{margin-top:36px}p{color:#d4c9b5}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}figure{margin:0;border:1px solid #79633f;border-radius:14px;overflow:hidden;background:#243341}figure a{display:block;aspect-ratio:5/7}img{display:block;width:100%;height:100%;object-fit:contain}figcaption{padding:13px;line-height:1.6}.cutouts a{background:repeating-conic-gradient(#394759 0% 25%,#222e3d 0% 50%) 50%/22px 22px}a{color:#edc481}small{display:block;color:#b5b2a9;font-size:12px}@media(max-width:750px){main{padding:16px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}h1{font-size:24px}figcaption{font-size:14px;padding:10px}}'''
parts=['<!doctype html><html lang="lo"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ເດັກ 14 · ນັກດາບສາວມໍປາຍ</title><style>'+css+'</style><main><h1>⚔ ນັກດາບສາວມໍປາຍ · ຮູບໃໝ່</h1><p>ເສື້ອນັກຮຽນຂາວ · ສິ້ນລາວ · ດາບຄາຕານະ · ໂຮງຮຽນຍຸກປະຈຸບັນ</p><p>25 ຮູບ · ແຕ່ລະຄົນມີເອກະລັກຂອງຕົນເອງ</p>']
for section,title in [('cards','ຮູບກາດ ແລະອາດພິເສດ'),('cutouts','ໄດຄັດໂປ່ງໃສ'),('box','ກ່ອງເດັກ')]:
    parts.append('<h2>'+title+'</h2><div class="grid '+section+'">')
    for r in rows:
        if r['section']!=section:continue
        f=html.escape(r['file']);name=html.escape(r['name'])
        parts.append('<figure><a href="'+f+'"><img loading="lazy" src="'+f+'" alt="'+name+'"></a><figcaption>'+name+'<small>'+str(r['width'])+' × '+str(r['height'])+'</small></figcaption></figure>')
    parts.append('</div>')
parts.append('<h2>ເອັບເຟັກໂປ່ງໃສ · 6 ຮູບ</h2><div class="grid cutouts">')
for r in fx:
    name=json.loads((root/'fx'/(r['id']+'.json')).read_text())['name']
    f='fx/'+r['id']+'.png'
    parts.append('<figure><a href="'+f+'"><img loading="lazy" src="'+f+'" alt="'+name+'"></a><figcaption>'+name+'</figcaption></figure>')
parts.append('</div><h2>ສຽງ SFX · 11 ແບບ</h2><p>'+('ສຽງ ElevenLabs ຂອງເຈົ້າ' if owner_audio else 'ສຽງສ້າງໃນເຄື່ອງ')+' · <a href="sfx/ELEVENLABS-PROMPTS.html">ພຣອມ ElevenLabs</a></p><div class="grid">')
for r in sounds:
    parts.append('<figure><figcaption>'+r['name']+'<audio controls preload="none" style="width:100%;margin-top:12px" src="sfx/'+Path(r['file']).name+'"></audio><small>'+str(r['duration'])+' ວິນາທີ</small></figcaption></figure>')
parts.append('</div>')
if voices:
    parts.append('<h2>ສຽງພາກລາວ · '+str(len(voices))+' ບົດ</h2><p><a href="voice/VOICE-PROMPTS.txt">ບົດພາກທັງ 6</a></p><div class="grid">')
    for r in voices:
        parts.append('<figure><figcaption>'+html.escape(r['name'])+'<p>'+html.escape(r['line'])+'</p><audio controls preload="none" style="width:100%" src="voice/'+r['id']+'.m4a"></audio></figcaption></figure>')
    parts.append('</div>')
parts.append('</main></html>');(root/'index.html').write_text('\n'.join(parts))
archive=root.with_suffix('.zip')
extras=['README.md','index.html','PROMPTS.txt','MANIFEST.json','alpha-check.json']
if (root/'FUSION-FANTASY-PROMPTS.txt').exists():extras.append('FUSION-FANTASY-PROMPTS.txt')
if (root/'SPECIAL-TRANSFORMATION-PROMPTS.txt').exists():extras.append('SPECIAL-TRANSFORMATION-PROMPTS.txt')
files=[root/r['file'] for r in rows]+[root/r['prompt'] for r in rows]+[root/f for f in extras]
files += [root/'fx'/(r['id']+'.png') for r in fx]+[root/'fx/prompts'/(r['id']+'.txt') for r in fx]+[root/'fx/manifest.json']
files += list((root/'sfx').glob('*.wav'))+list((root/'sfx').glob('*.m4a'))+[root/'sfx/manifest.json',root/'sfx/ELEVENLABS-PROMPTS.txt',root/'sfx/ELEVENLABS-PROMPTS.html']
if owner_audio:
    for r in sounds:
        p=root/'sfx/owner-originals'/r['sourceFile']
        assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sourceSha256']
        files.append(p)
if voices:
    files += [root/'voice/manifest.json',root/'voice/scripts.json',root/'voice/VOICE-PROMPTS.txt']
    for r in voices:
        for ext in ['.m4a','.wav']:files.append(root/'voice'/(r['id']+ext))
        p=repo/r['original'];assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sourceSha256'];files.append(p)
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:z.write(p,str(Path(root.name)/p.relative_to(root)))
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert sum(n.endswith('.png') for n in z.namelist())==31
    assert sum(n.endswith('.m4a') and '/sfx/' in n for n in z.namelist())==11
    assert sum(n.endswith('.wav') and '/sfx/' in n for n in z.namelist())==11
    if owner_audio:assert sum(n.endswith('.mp3') and '/sfx/' in n for n in z.namelist())==11
    assert sum(n.endswith('.m4a') and '/voice/' in n for n in z.namelist())==len(voices)
print(json.dumps(dict(images=31,sounds=11,voices=len(voices),zip=str(archive),MB=round(archive.stat().st_size/1024**2,1))))
