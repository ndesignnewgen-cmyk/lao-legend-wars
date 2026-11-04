#!/usr/bin/env python3
"""Import one owner-labelled deck 14 voice, retaining the unmodified source."""
from pathlib import Path
import argparse, hashlib, json, math, re, shutil, subprocess

ROOT=Path(__file__).resolve().parent.parent
def run(*args):return subprocess.run([str(x) for x in args],capture_output=True,text=True,check=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def duration(p):return float(run('ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',p).stdout)
def levels(p,filters='anull'):
    log=run('ffmpeg','-hide_banner','-nostats','-i',p,'-af',filters+',loudnorm=I=-18:TP=-3:LRA=9:print_format=json','-f','null','-').stderr
    stats=json.loads(re.search(r'\{\s*"input_i"[\s\S]*?\}',log)[0])
    return float(stats['input_i']),float(stats['input_tp'])

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('id');ap.add_argument('source',type=Path);ap.add_argument('--version',default='v30-blade-voices');a=ap.parse_args()
    rows=json.loads((ROOT/'design/deck-14-voices.json').read_text());row=next(r for r in rows if r['id']==a.id)
    src=a.source.resolve();digest=sha(src);length=duration(src);assert .4<length<15
    work=ROOT/'outputs/deck-14-voice-import'/a.id/digest[:12];work.mkdir(parents=True,exist_ok=True)
    log=run('ffmpeg','-hide_banner','-nostats','-i',src,'-af','silencedetect=noise=-50dB:d=0.1','-f','null','-').stderr
    events=[(k,float(v)) for k,v in re.findall(r'silence_(start|end): ([\d.]+)',log)]
    start,end=0.,length
    if len(events)>1 and events[0]==('start',0.) and events[1][0]=='end':start=max(0.,events[1][1]-.04)
    if len(events)>1 and events[-1][0]=='end' and abs(events[-1][1]-length)<.02 and events[-2][0]=='start':end=min(length,events[-2][1]+.1)
    assert end-start>.35
    trim=f'atrim=start={start:.6f}:end={end:.6f},asetpts=PTS-STARTPTS'
    loud,peak=levels(src,trim);assert math.isfinite(loud) and math.isfinite(peak)
    gain=min(9.,-18-loud,-3-peak)
    filters=trim+f',volume={gain:.3f}dB,afade=t=in:d=0.003,afade=t=out:st={end-start-.02:.6f}:d=0.02'
    wav=work/(a.id+'.wav');aac=work/(a.id+'.m4a')
    run('ffmpeg','-y','-hide_banner','-loglevel','error','-i',src,'-map_metadata','-1','-af',filters,'-ar','48000','-ac','1','-c:a','pcm_s16le',wav)
    run('ffmpeg','-y','-hide_banner','-loglevel','error','-i',wav,'-map_metadata','-1','-c:a','aac','-b:a','128k','-movflags','+faststart',aac)
    out_loud,out_peak=levels(aac);bitrate=128
    # Some generated transients overshoot after AAC quantization. Preserve their
    # dynamics at a higher bitrate before considering any extra attenuation.
    if out_peak>-1.5:
        bitrate=256
        run('ffmpeg','-y','-hide_banner','-loglevel','error','-i',wav,'-map_metadata','-1','-c:a','aac','-b:a','256k','-movflags','+faststart',aac)
        out_loud,out_peak=levels(aac)
    assert out_peak<=-1.5 and sha(src)==digest
    dest=ROOT/row['target'];backup=work/'before';backup.mkdir(exist_ok=True)
    for p in [dest,ROOT/'design/deck-14-voices.json',ROOT/'index.html',ROOT/'sw.js']:
        if p.exists() and not (backup/p.name).exists():shutil.copy2(p,backup/p.name)
    originals=ROOT/'outputs/deck-14-cute-school-v4/voice/owner-originals';originals.mkdir(parents=True,exist_ok=True)
    original=originals/(a.id+'-'+digest[:12]+src.suffix.lower());shutil.copy2(src,original);assert sha(original)==digest
    dest.parent.mkdir(exist_ok=True);shutil.copy2(aac,dest)
    for p in [wav,aac]:shutil.copy2(p,originals.parent/p.name)
    row.update(status='installed',file=row['target'],source='Owner-provided recording',sourceFile=src.name,sourceSha256=digest,sourceDuration=length,original=str(original.relative_to(ROOT)),duration=duration(aac),trimmedStart=round(start,6),trimmedEnd=round(length-end,6),gainDb=round(gain,3),integratedLUFS=out_loud,truePeakDb=out_peak,bitrateKbps=bitrate,bytes=aac.stat().st_size,sha256=sha(aac),wavSha256=sha(wav))
    (ROOT/'design/deck-14-voices.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
    (originals.parent/'manifest.json').write_text(json.dumps([r for r in rows if r['status']=='installed'],ensure_ascii=False,indent=2)+'\n')
    html=(ROOT/'index.html').read_text();m=re.search(r'const VOICES = (\[[^\]]*\]);',html);assert m
    voices=re.findall(r"['\"]([^'\"]+)['\"]",m[1])
    if a.id not in voices:voices.append(a.id)
    html=html[:m.start(1)]+json.dumps(voices)+html[m.end(1):]
    # Leave a small tail after the full spoken line; no changes to game rules.
    ms=math.ceil((row['duration']*1000+350)/100)*100
    scene_id=a.id.removeprefix('alt-');field='altMs' if a.id.startswith('alt-') else 'ms'
    pattern=r'(?m)^ '+re.escape(scene_id)+r':\{[^\n]*\}'
    if re.search(pattern,html):html=re.sub(pattern,lambda m:re.sub(r','+field+r':\d+','',m[0])[:-1]+','+field+':'+str(ms)+'}',html,count=1)
    (ROOT/'index.html').write_text(html)
    p=ROOT/'sw.js';p.write_text(re.sub(r"const VERSION = '[^']+';","const VERSION = "+repr(a.version)+";",p.read_text(),count=1))
    (work/'verification.json').write_text(json.dumps(row,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(id=a.id,duration=row['duration'],bytes=row['bytes'],peak=out_peak,originalUnchanged=sha(src)==digest,sceneMs=ms)))

if __name__=='__main__':main()
