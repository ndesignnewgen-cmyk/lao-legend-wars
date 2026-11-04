#!/usr/bin/env python3
"""Prepare/import only the current jacket-free, katana school artwork; preserve originals."""
from pathlib import Path
import collections, hashlib, json, re, shutil, struct, subprocess, sys

REPO = Path(__file__).resolve().parent.parent
SOURCE = REPO / 'outputs/deck-14-cute-school-v4'
CARDS = ['nangchampa','daphangma','dapsongmue','dappi1','dapkhu','dapjaidi','dapwaen','daphuana','dapolo','ajandap','dapmai','dapngoen','fondap','tatlom','hofuek','khudapphen','champathong','alt-champathong']
CUTS = ['nangchampa','dapsongmue','ajandap','khudapphen','champathong','alt-champathong']
EXPECTED = CARDS + ['cut-'+x for x in CUTS] + ['box-d14']

def run(args):
    return subprocess.run([str(x) for x in args], check=True, capture_output=True).stdout

def size(p):
    data = p.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', p
    return struct.unpack('>II', data[16:24])

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    if (SOURCE/'NOT-FOR-IMPORT.md').exists():
        sys.exit('No files changed; this art direction was rejected.')
    missing = [x for x in EXPECTED if not (SOURCE/(x+'.png')).exists()]
    if missing:
        sys.exit('No files changed; missing PNGs: '+', '.join(missing))
    prepared = SOURCE/'prepared'
    prepared.mkdir(exist_ok=True)
    targets = {}
    for ident in CARDS:
        original = SOURCE/(ident+'.png')
        master = prepared/(ident+'.jpg')
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',original,'-vf','scale=760:-1','-frames:v','1','-q:v','2',master])
        targets['art/'+ident+'.jpg'] = master
        for folder,width,quality in [('w',560,76),('w2',min(1100,size(original)[0]),86)]:
            p = prepared/(ident+'-'+folder+'.webp')
            run(['cwebp','-quiet','-q',quality,'-sharp_yuv','-resize',width,0,original,'-o',p])
            targets['art/'+folder+'/'+ident+'.webp'] = p
    cut_boxes, alpha_report = {}, []
    for ident in CUTS:
        original = SOURCE/('cut-'+ident+'.png')
        w,h = size(original)
        alpha = run(['ffmpeg','-hide_banner','-loglevel','error','-i',original,'-vf','alphaextract','-f','rawvideo','-pix_fmt','gray','pipe:1'])
        assert len(alpha) == w*h, ident
        hist = collections.Counter(alpha)
        transparent = sum(n for a,n in hist.items() if a <= 8)
        opaque = sum(n for a,n in hist.items() if a >= 245)
        assert transparent > w*h*.06 and opaque > w*h*.05, ('Expected real transparent cutout',ident)
        x0,y0,x1,y1 = w,h,0,0
        for y in range(h):
            line = alpha[y*w:(y+1)*w]
            xs = [i for i,a in enumerate(line) if a > 12]
            if xs:
                x0=min(x0,xs[0]); x1=max(x1,xs[-1]); y0=min(y0,y); y1=max(y1,y)
        margin = 16
        x0=max(0,x0-margin); y0=max(0,y0-margin); x1=min(w,x1+margin+1); y1=min(h,y1+margin+1)
        cw,ch=x1-x0,y1-y0
        cropped = prepared/('cut-'+ident+'.png')
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',original,'-vf',f'crop={cw}:{ch}:{x0}:{y0}:exact=1','-frames:v','1',cropped])
        dest=prepared/('cut-'+ident+'.webp')
        run(['cwebp','-quiet','-q','88','-alpha_q','100','-resize',min(1100,cw),0,cropped,'-o',dest])
        targets['art/cut/'+ident+'.webp']=dest
        cut_boxes[ident]=[0,0,1,1,round(ch*760/cw,1)]
        alpha_report.append(dict(id=ident,width=w,height=h,transparent=transparent,opaque=opaque,crop=[x0,y0,cw,ch],box=cut_boxes[ident]))
    # Existing fusion entrance uses this alias; keep it in sync with the new normal cutout.
    targets['art/cut/champathong-full.webp']=targets['art/cut/champathong.webp']
    box=prepared/'box-d14.webp'
    run(['cwebp','-quiet','-q','86','-alpha_q','100','-resize','760',0,SOURCE/'box-d14.png','-o',box])
    targets['art/box-d14.webp']=box
    html=(REPO/'index.html').read_text()
    match=re.search(r'const CUTS = \{(.*?)\};',html,re.S)
    assert match
    body=match.group(1)
    for ident,coords in cut_boxes.items():
        pattern=r'(?<![\w-])(?:'+re.escape(ident)+r'|\"'+re.escape(ident)+r'\"|\''+re.escape(ident)+r'\'):\[[^\]]*\]'
        entry=json.dumps(ident)+':'+json.dumps(coords,separators=(',',':'))
        if re.search(pattern,body):
            body=re.sub(pattern,lambda _:entry,body,count=1)
        else:
            body=entry+','+body
    html=html[:match.start(1)]+body+html[match.end(1):]
    if not re.search(r"13:\{img:'box-d14'",html):
        html=html.replace('const BOXES = {',"const BOXES = {13:{img:'box-d14', rt:'82%', rl:'15%', rr:'24%'}, ",1)
    assert html != (REPO/'index.html').read_text() or '--reimport' in sys.argv
    # All source PNGs have been prepared and checked before any game file is touched.
    backup=SOURCE/'originals'
    for rel in list(targets)+['index.html','sw.js']:
        src=REPO/rel; dest=backup/rel
        if src.exists() and not dest.exists():
            dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
    for rel,src in targets.items():
        dest=REPO/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
    (REPO/'index.html').write_text(html)
    sw=REPO/'sw.js'
    sw.write_text(re.sub(r"const VERSION = '[^']+';","const VERSION = 'v24-school-remake-fx';",sw.read_text(),count=1))
    (SOURCE/'alpha-check.json').write_text(json.dumps(alpha_report,indent=2))
    records=[dict(file=rel,bytes=(REPO/rel).stat().st_size,sha256=sha(REPO/rel)) for rel in targets]
    (SOURCE/'imported-art.json').write_text(json.dumps(records,indent=2))
    run([sys.executable,REPO/'tools/build-security.py'])
    print(json.dumps(dict(images=len(EXPECTED),gameAssets=len(records),cutouts=len(CUTS),version='v24-school-remake-fx')))

if __name__=='__main__':
    main()
