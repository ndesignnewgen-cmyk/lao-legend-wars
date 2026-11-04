#!/usr/bin/env python3
"""Validate transparent FX masters and import compact game copies."""
from pathlib import Path
import collections, hashlib, json, shutil, struct, subprocess
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'outputs/deck-14-cute-school-v4/fx'
IDS=['blade-silver-arc','blade-twin-arc','blade-champa-ring','blade-champa-bloom','blade-flower-guard','blade-petal-wisp']
rows=[]
for ident in IDS:
    src=SOURCE/(ident+'.png');w,h=struct.unpack('>II',src.read_bytes()[16:24])
    alpha=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(src),'-vf','alphaextract','-f','rawvideo','-pix_fmt','gray','pipe:1'],check=True,capture_output=True).stdout
    assert len(alpha)==w*h
    hist=collections.Counter(alpha);transparent=sum(v for k,v in hist.items() if k<=8);opaque=sum(v for k,v in hist.items() if k>=245)
    assert transparent>w*h*.06 and opaque>w*h*.002,(ident,'missing alpha or empty sprite')
    master=ROOT/'art/fx/source'/(ident+'.png');master.parent.mkdir(exist_ok=True);shutil.copy2(src,master)
    dest=ROOT/'art/fx'/(ident+'.webp')
    subprocess.run(['cwebp','-quiet','-q','88','-alpha_q','95','-resize','720','0',str(src),'-o',str(dest)],check=True)
    rows.append(dict(id=ident,width=w,height=h,transparent=transparent,opaque=opaque,file=str(dest.relative_to(ROOT)),bytes=dest.stat().st_size,sha256=hashlib.sha256(dest.read_bytes()).hexdigest()))
(SOURCE/'manifest.json').write_text(json.dumps(rows,indent=2))
print(json.dumps(dict(sprites=len(rows),gameBytes=sum(r['bytes'] for r in rows))))
