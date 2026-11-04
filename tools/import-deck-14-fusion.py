#!/usr/bin/env python3
"""Replace only the redesigned ultimate fusion (normal/alt and both cutouts)."""
from pathlib import Path
import argparse, collections, hashlib, json, re, shutil, struct, subprocess, sys

ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'outputs/deck-14-fusion-fantasy-v6'
PACK=ROOT/'outputs/deck-14-cute-school-v4'
CARDS=['champathong','alt-champathong']
IDS=CARDS+['cut-'+s for s in CARDS]
def run(args):return subprocess.run([str(x) for x in args],check=True,capture_output=True).stdout
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def size(p):
    b=p.read_bytes();assert b[:8]==b'\x89PNG\r\n\x1a\n';return struct.unpack('>II',b[16:24])

def main():
    global SOURCE,CARDS,IDS
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path)
    parser.add_argument('--alt-only',action='store_true')
    parser.add_argument('--version',default='v27-fusion-fantasy')
    args=parser.parse_args()
    if args.source:SOURCE=(ROOT/args.source).resolve()
    if args.alt_only:CARDS=['alt-champathong'];IDS=CARDS+['cut-'+s for s in CARDS]
    if args.source:assert args.version!='v27-fusion-fantasy','Specify a new cache version for replacement art'
    assert not (SOURCE/'NOT-FOR-IMPORT.md').exists(),'Rejected pose must not be imported'
    assert all((SOURCE/(s+'.png')).exists() and (SOURCE/'prompts'/(s+'.txt')).exists() for s in IDS),'Prepare all four assets first'
    prepared=SOURCE/'prepared';prepared.mkdir(exist_ok=True)
    targets={};boxes={};alpha=[]
    for ident in CARDS:
        src=SOURCE/(ident+'.png');dest=prepared/(ident+'.jpg')
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',src,'-vf','scale=760:-1','-frames:v','1','-q:v','2',dest]);targets['art/'+ident+'.jpg']=dest
        for folder,width,q in [('w',560,76),('w2',min(1100,size(src)[0]),86)]:
            dest=prepared/(ident+'-'+folder+'.webp');run(['cwebp','-quiet','-q',q,'-sharp_yuv','-resize',width,0,src,'-o',dest]);targets['art/'+folder+'/'+ident+'.webp']=dest
        src=SOURCE/('cut-'+ident+'.png');w,h=size(src)
        a=run(['ffmpeg','-hide_banner','-loglevel','error','-i',src,'-vf','alphaextract','-f','rawvideo','-pix_fmt','gray','pipe:1'])
        assert len(a)==w*h;hist=collections.Counter(a);transparent=sum(n for k,n in hist.items() if k<=8);opaque=sum(n for k,n in hist.items() if k>=245)
        assert transparent>w*h*.06 and opaque>w*h*.05,(ident,'Expected true transparency')
        x0,y0,x1,y1=w,h,0,0
        for y in range(h):
            xs=[x for x,v in enumerate(a[y*w:(y+1)*w]) if v>12]
            if xs:x0=min(x0,xs[0]);x1=max(x1,xs[-1]);y0=min(y0,y);y1=max(y1,y)
        x0=max(0,x0-16);y0=max(0,y0-16);x1=min(w,x1+17);y1=min(h,y1+17);cw,ch=x1-x0,y1-y0
        cropped=prepared/('cut-'+ident+'.png');dest=prepared/('cut-'+ident+'.webp')
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',src,'-vf',f'crop={cw}:{ch}:{x0}:{y0}:exact=1','-frames:v','1',cropped])
        run(['cwebp','-quiet','-q','88','-alpha_q','100','-resize',min(1100,cw),0,cropped,'-o',dest]);targets['art/cut/'+ident+'.webp']=dest
        boxes[ident]=[0,0,1,1,round(ch*760/cw,1)]
        alpha.append(dict(id=ident,width=w,height=h,transparent=transparent,opaque=opaque,crop=[x0,y0,cw,ch],box=boxes[ident]))
    if 'champathong' in CARDS:targets['art/cut/champathong-full.webp']=targets['art/cut/champathong.webp']
    html=(ROOT/'index.html').read_text();m=re.search(r'const CUTS = \{(.*?)\};',html,re.S);assert m;body=m[1]
    for ident,box in boxes.items():
        pattern=r'(?<![\w-])(?:'+re.escape(ident)+r'|\"'+re.escape(ident)+r'\"|\''+re.escape(ident)+r'\'):\[[^\]]*\]'
        body,n=re.subn(pattern,lambda _:json.dumps(ident)+':'+json.dumps(box,separators=(',',':')),body,count=1);assert n==1
    html=html[:m.start(1)]+body+html[m.end(1):]
    backup=SOURCE/'before';backup.mkdir(exist_ok=True)
    for rel in [*targets,'index.html','sw.js']:
        p=ROOT/rel;dest=backup/rel
        if p.exists() and not dest.exists():dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
    for ident in IDS:
        for rel in [ident+'.png','prompts/'+ident+'.txt','source-'+ident+'.json']:
            p=PACK/rel;dest=backup/'pack'/rel
            if p.exists() and not dest.exists():dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
            src=SOURCE/rel
            if src.exists():shutil.copy2(src,p)
    for rel,src in targets.items():shutil.copy2(src,ROOT/rel)
    (ROOT/'index.html').write_text(html)
    p=ROOT/'sw.js';p.write_text(re.sub(r"const VERSION = '[^']+';","const VERSION = "+repr(args.version)+";",p.read_text(),count=1))
    previous=json.loads((PACK/'alpha-check.json').read_text());previous=[r for r in previous if r['id'] not in CARDS]+alpha
    (PACK/'alpha-check.json').write_text(json.dumps(previous,indent=2));(SOURCE/'alpha-check.json').write_text(json.dumps(alpha,indent=2))
    previous=json.loads((PACK/'imported-art.json').read_text());records=[dict(file=rel,bytes=(ROOT/rel).stat().st_size,sha256=sha(ROOT/rel)) for rel in targets]
    (PACK/'imported-art.json').write_text(json.dumps([r for r in previous if r['file'] not in targets]+records,indent=2))
    (SOURCE/'imported-art.json').write_text(json.dumps(records,indent=2))
    jobs=json.loads((PACK/'extra-jobs.json').read_text())
    for j in jobs:
        if j['id'] in IDS:
            meta=json.loads((SOURCE/('source-'+j['id']+'.json')).read_text());j.update(prompt=meta['prompt'],refs=meta['refs'],alpha=meta['alpha'])
    (PACK/'extra-jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2))
    stages=[] if args.alt_only else [('Fantasy face and costume design reference',ROOT/'outputs/deck-14-fusion-fantasy-v5/prompts/champathong.txt'),('Two-visible-legs pose revision',SOURCE/'revisions/before-framing/champathong-prompt.txt')]
    text=('ເທວີດາບຈຳປາທອງ · ອາດພິເສດສາກແປງຮ່າງ' if args.alt_only else 'ເທວີດາບຈຳປາທອງ · ໃບໜ້າ/ຊຸດແຟນຕາຊີ ແລະທ່າໃໝ່ເຫັນຂາສອງຂ້າງ')+'\n\n'
    text+='\n\n'.join('['+name+']\n'+path.read_text() for name,path in stages)+'\n\n'
    text+='\n\n'.join('['+s+']\n'+(SOURCE/'prompts'/(s+'.txt')).read_text() for s in IDS)
    promptfile='deck-14-special-transformation.txt' if args.alt_only else 'deck-14-fusion-fantasy.txt'
    packfile='SPECIAL-TRANSFORMATION-PROMPTS.txt' if args.alt_only else 'FUSION-FANTASY-PROMPTS.txt'
    (ROOT/'prompts'/promptfile).write_text(text,encoding='utf-8-sig')
    (PACK/packfile).write_text(text,encoding='utf-8-sig')
    run([sys.executable,ROOT/'tools/build-security.py'])
    print(json.dumps(dict(images=len(IDS),gameAssets=len(targets),cutouts=len(alpha),version=args.version)))

if __name__=='__main__':main()
