#!/usr/bin/env python3
"""Package the 49 approved PNG masters only; no rejected art or private metadata."""
from pathlib import Path
import json,hashlib,struct,zipfile,html,shutil
repo=Path(__file__).resolve().parent.parent
root=repo/'outputs/deck-27-cyber-dinosaurs-2026-11-04-v3'
job=json.loads((root/'bundle-source.json').read_text())
new=set(job['newIds']);names=dict((id,d['name']) for id,d in json.loads((repo/'outputs/dino-card-data.json').read_text()))
manifest=[];sections={}
for folder,count in [('cards',22),('alt',6),('box',1),('cutouts',15),('fx',5)]:
 rows=[]
 for p in sorted((root/folder).glob('*.png')):
  ident=p.stem;data=p.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n';w,h=struct.unpack('>II',data[16:24]);base=ident.removeprefix('cut-').removeprefix('alt-')
  rows.append(dict(id=ident,file=str(p.relative_to(root)),name=names.get(base,ident),width=w,height=h,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),prompt='prompts/'+ident+'.txt'))
 assert len(rows)==count,(folder,len(rows));sections[folder]=rows;manifest+=rows
assert len(manifest)==49 and len(set(r['sha256']for r in manifest))==49
assert len(json.loads((root/'alpha-check.json').read_text()))==20
(root/'MANIFEST.json').write_text(json.dumps(dict(version=3,count=49,images=manifest),ensure_ascii=False,indent=2))
prompts='ເດັກ 27 · ຮູບ v3 · ພຣອມທີ່ໃຊ້ຈິງ\n\n'+'\n\n'.join('['+r['id']+']\n'+(root/r['prompt']).read_text()for r in manifest)
(root/'PROMPTS.txt').write_text(prompts)
(repo/'prompts/deck-27-humanoid-evolution.txt').write_text('ເດັກ 27 · ຮ່າງນັກຮົບ · 13 ຮູບ\n\n'+'\n\n'.join('['+r['id']+']\n'+(root/r['prompt']).read_text()for r in manifest if r['id']in new))
shutil.copy2(repo/'design/deck-27-cyber-dinosaurs.md',root/'DECK-DESIGN.md');shutil.copy2(repo/'design/deck-27-humanoid-evolution.md',root/'HUMANOID-EVOLUTION.md')
(root/'README.md').write_text('''# ເດັກ 27 · ໄດໂນເສົາ — ອານາຈັກໄຊບອດ · v3

ຮູບ PNG ແຍກ 49 ຮູບ: ກາດ 22, ອາດພິເສດ 6, ກ່ອງ 1, ໄດຄັດ 15 ແລະເອັບເຟັກ 5.
ໄດຄັດແລະເອັບເຟັກ 20 ຮູບເປັນ PNG ໂປ່ງໃສ ກວດ alpha ແລ້ວ.
ໃຊ້ຮູບຊຸດແກ້ທ່າ/ສາກ v2 + ຮ່າງນັກຮົບໃໝ່ 13 ຮູບ. ບໍ່ລວມຮູບເກົ່າທີ່ຄັດອອກ.

ແຕກ ZIP → ເປີດ index.html ເພື່ອເບິ່ງຮູບຄົບ. ເປີດ hybrids.html ເພື່ອເບິ່ງຮູບໃໝ່ 13 ຮູບ.
ກົດຮູບເພື່ອເບິ່ງຕົ້ນສະບັບ. PROMPTS.txt ແລະ prompts/ ແມ່ນພຣອມທີ່ໃຊ້ຈິງ.

ເດັກເຂົ້າເກມແລ້ວໃນເຄື່ອງ: 30 ໃບ, ຟັກໄຂ່ → ໄຊບອດ → ນັກຮົບ.
ລອງບອດກາງ 2,600 ເກມ ຊະນະ 52.46%. ຍັງບໍ່ອັບເວັບ/ຕິດຕັ້ງ Supabase.
''')
css='''*{box-sizing:border-box}body{margin:0;background:#0b211a;color:#f6e9c6;font:16px/1.7 Arial,sans-serif}main{max-width:1450px;margin:auto;padding:26px}h1{color:#f0ce77}h2{margin-top:36px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}article{border:1px solid #6d7647;background:#16392b;border-radius:14px;overflow:hidden}article a{display:block;aspect-ratio:63/88}article img{width:100%;height:100%;object-fit:contain;display:block}.wide a{aspect-ratio:3/2;background:repeating-conic-gradient(#294b3d 0% 25%,#183126 0% 50%) 50%/24px 24px}footer{padding:10px}small{display:block;color:#b7cdba;overflow-wrap:anywhere}nav{display:flex;gap:12px;flex-wrap:wrap}nav a{color:#f0ce77}@media(max-width:850px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}main{padding:16px}}'''
titles=dict(cards='ຮູບກາດ',alt='ອາດພິເສດ',box='ກ່ອງ',cutouts='ໄດຄັດ',fx='ເອັບເຟັກ')
def gallery(only=False):
 out=['<!doctype html><html lang="lo"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ເດັກ 27 · v3</title><style>'+css+'</style><main><h1>🦖 ເດັກ 27 · ອານາຈັກໄຊບອດ</h1><p>'+('ຮ່າງນັກຮົບ · 13 ຮູບໃໝ່'if only else 'ຊຸດຄົບ · 49 ຮູບ')+'</p><nav><a href="index.html">ຮູບທັງໝົດ</a><a href="hybrids.html">ຮູບໃໝ່</a></nav>']
 for key,rows in sections.items():
  rows=[r for r in rows if not only or r['id']in new]
  if not rows:continue
  out+=['<h2>'+titles[key]+' · '+str(len(rows))+'</h2><div class="grid '+('wide'if key in ('cutouts','fx')else '')+'">']
  for r in rows:
   f=html.escape(r['file']);out+=['<article><a href="'+f+'"><img loading="lazy" src="'+f+'" alt="'+html.escape(r['name'])+'"></a><footer>'+html.escape(r['name'])+'<small>'+r['id']+' · '+str(r['width'])+' × '+str(r['height'])+'</small></footer></article>']
  out+=['</div>']
 return '\n'.join(out+['</main></html>'])
(root/'index.html').write_text(gallery());(root/'hybrids.html').write_text(gallery(True))
files=[root/r['file']for r in manifest]+[root/r['prompt']for r in manifest]+[root/n for n in ['README.md','index.html','hybrids.html','PROMPTS.txt','DECK-DESIGN.md','HUMANOID-EVOLUTION.md','MANIFEST.json','alpha-check.json']]
archive=root.with_suffix('.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for f in files:z.write(f,str(Path('deck-27-cyber-dinosaurs-v3')/f.relative_to(root)))
with zipfile.ZipFile(archive)as z:assert z.testzip()is None and sum(f.endswith('.png')for f in z.namelist())==49
print(json.dumps(dict(images=49,zip=str(archive),MB=round(archive.stat().st_size/1024**2,1))))
