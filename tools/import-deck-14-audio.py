#!/usr/bin/env python3
"""Import the owner's 11 ElevenLabs recordings; retain originals and provenance.

Trim only outer silence; apply linear, true-peak-safe gain and short edge fades.
Prepare/verify every file before replacing any game sound. No external service.
"""
from pathlib import Path
import concurrent.futures, hashlib, json, math, re, shutil, subprocess, sys

ROOT=Path(__file__).resolve().parent.parent
SOURCE=Path(sys.argv[1]) if len(sys.argv)>1 else Path.home()/'Downloads'
OUT=ROOT/'outputs/deck-14-cute-school-v4/sfx'
WORK=ROOT/'outputs/deck-14-audio-import'
TAKES=[
 ('draw','One_elegant_Japanese_#4-1793776514596.mp3'),
 ('slash','One_fast_precise_kat_#1-1793777012923.mp3'),
 ('double','Two_clearly_separate_#2-1793777075076.mp3'),
 ('guard','One_rounded_wooden_p_#4-1793777145472.mp3'),
 ('heal','A_gentle_upward_flor_#3-1793777192038.mp3'),
 ('focus','Sword-spirit_focus_c_#2-1793777240539.mp3'),
 ('training','Two_light_wooden_bok_#2-1793777294083.mp3'),
 ('legend','A_graceful_legendary_#4-1793777323818.mp3'),
 ('dance','Three_elegant_accele_#4-1793777373208.mp3'),
 ('fusion','Two_silvery_magical__#4-1793777409112.mp3'),
 ('ultimate','Ultimate_golden_plum_#2-1793777489857.mp3')
]

def run(*args):return subprocess.run([str(a) for a in args],capture_output=True,text=True,check=True)
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def duration(p):return float(run('ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',p).stdout)
def stats(p,filters='anull'):
    log=run('ffmpeg','-hide_banner','-nostats','-i',p,'-af',filters+',aresample=192000,volumedetect,loudnorm=I=-20:TP=-3:LRA=9:print_format=json','-f','null','-').stderr
    value=json.loads(re.search(r'\{\s*"input_i"[\s\S]*?\}',log).group())
    # BS.1770's 400ms integration window is undefined for a very short wooden tap.
    # Measure its RMS and oversampled peak too; never reject or pad audible content.
    mean=float(re.search(r'mean_volume: ([-\d.]+) dB',log)[1])
    peak=float(re.search(r'max_volume: ([-\d.]+) dB',log)[1])
    assert math.isfinite(peak) and mean>-90,('Silent or invalid source',p)
    integrated=float(value['input_i'])
    return dict(input_i=integrated if math.isfinite(integrated) else None,input_tp=peak,meanDb=mean)

def prepare(job):
    ident,name,source_hash,old=job
    src=SOURCE/name;length=duration(src)
    assert 0<length<20,(ident,'Unexpected recording duration',length)
    log=run('ffmpeg','-hide_banner','-nostats','-i',src,'-af','silencedetect=noise=-50dB:d=0.1','-f','null','-').stderr
    events=[(k,float(v)) for k,v in re.findall(r'silence_(start|end): ([\d.]+)',log)]
    start,end=0.,length
    if len(events)>=2 and events[0]==('start',0.) and events[1][0]=='end':start=max(0,events[1][1]-.015)
    if len(events)>=2 and events[-1][0]=='end' and abs(events[-1][1]-length)<.02 and events[-2][0]=='start':end=min(length,events[-2][1]+.08)
    assert end-start>.1,(ident,'No audible content')
    trim=f'atrim=start={start:.6f}:end={end:.6f},asetpts=PTS-STARTPTS'
    measured=stats(src,trim);target=-19 if ident in ['legend','fusion','ultimate'] else -20
    level=measured['input_i'] if measured['input_i'] is not None else measured['meanDb']
    gain=min(12.,target-level,-3-measured['input_tp'])
    filters=trim+f',volume={gain:.3f}dB,afade=t=in:d=0.002,afade=t=out:st={max(0,end-start-.025):.6f}:d=0.025'
    stem='blade-'+ident;wav=WORK/(stem+'.wav');aac=WORK/(stem+'.m4a')
    run('ffmpeg','-y','-hide_banner','-loglevel','error','-i',src,'-map_metadata','-1','-af',filters,'-ar','48000','-ac','2','-c:a','pcm_s16le',wav)
    run('ffmpeg','-y','-hide_banner','-loglevel','error','-i',wav,'-map_metadata','-1','-c:a','aac','-b:a','160k','-movflags','+faststart',aac)
    measured_out=stats(aac);assert float(measured_out['input_tp'])<=-1.5,(ident,measured_out)
    assert digest(src)==source_hash,'An original source changed during import'
    return dict(id=ident,name=old['name'],prompt=old['prompt'],requestedDuration=old.get('requestedDuration',old['duration']),
                duration=duration(aac),file='art/sfx/'+stem+'.m4a',source='ElevenLabs (owner provided)',sourceFile=name,
                sourceSha256=source_hash,sourceBytes=src.stat().st_size,sourceDuration=length,
                trimmedStart=round(start,6),trimmedEnd=round(length-end,6),gainDb=round(gain,3),
                integratedLUFS=measured_out['input_i'],meanDb=measured_out['meanDb'],truePeakDb=measured_out['input_tp'],
                bytes=aac.stat().st_size,sha256=digest(aac),wavSha256=digest(wav))

def main():
    old_rows=json.loads((ROOT/'design/deck-14-audio.json').read_text());old={r['id']:r for r in old_rows}
    jobs=[(ident,name,digest(SOURCE/name),old[ident]) for ident,name in TAKES]
    assert len(jobs)==11 and len({j[2] for j in jobs})==11,'Expected 11 distinct source recordings'
    WORK.mkdir(exist_ok=True);OUT.mkdir(exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(prepare,jobs))
    backup=ROOT/'outputs/deck-14-cute-school-v4/originals/procedural-sfx'
    backup.mkdir(parents=True,exist_ok=True)
    for path in [ROOT/'design/deck-14-audio.json',OUT/'manifest.json',*list(OUT.glob('*.wav')),*[ROOT/r['file'] for r in rows]]:
        dest=backup/path.name
        if path.exists() and not dest.exists():shutil.copy2(path,dest)
    originals=OUT/'owner-originals';originals.mkdir(exist_ok=True)
    for row in rows:
        stem='blade-'+row['id']
        shutil.copy2(WORK/(stem+'.wav'),OUT/(stem+'.wav'))
        shutil.copy2(WORK/(stem+'.m4a'),ROOT/row['file'])
        shutil.copy2(WORK/(stem+'.m4a'),OUT/(stem+'.m4a'))
        shutil.copy2(SOURCE/row['sourceFile'],originals/row['sourceFile'])
        assert digest(originals/row['sourceFile'])==row['sourceSha256']
    for path in [ROOT/'design/deck-14-audio.json',OUT/'manifest.json']:
        path.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
    (WORK/'verification.json').write_text(json.dumps(dict(received=11,imported=11,processing='Outer silence trim only; peak-safe linear gain; 2/25ms edge fades; AAC 160kbps 48k stereo. Original MP3s unchanged.',files=rows),ensure_ascii=False,indent=2)+'\n')
    # Preserve the original prompts and their suggested durations; update their status only.
    previous='ສຽງທີ່ໃສ່ຢູ່ຕອນນີ້ແມ່ນສຽງສ້າງໃນເຄື່ອງ.'
    current='ສຽງ ElevenLabs ຂອງເຈົ້າໃສ່ໃນເກມແລ້ວ.'
    for path in [ROOT/'prompts/deck-14-sfx-elevenlabs.txt',OUT/'ELEVENLABS-PROMPTS.txt']:
        path.write_text(path.read_text(encoding='utf-8-sig').replace(previous,current),encoding='utf-8-sig')
    page=ROOT/'tools/deck-14-sfx.html';content=page.read_text()
    content=content.replace('ສຽງຊຸດນີ້ສ້າງໃນເຄື່ອງ. ມີພຣອມ ElevenLabs ສຳລັບເຈນປ່ຽນໄດ້.','✓ ໃສ່ສຽງ ElevenLabs ຂອງເຈົ້າແລ້ວ · ປັບຄວາມດັງໃຫ້ເຂົ້າກັນ.')
    by_id={r['id']:r for r in rows}
    def update_tile(match):
        tile=match.group();m=re.search(r'blade-([a-z]+)\.m4a',tile)
        if not m:return tile
        r=by_id[m[1]]
        tile=re.sub(r'(blade-[a-z]+\.m4a)(?:\?[^\"]*)?',lambda m:m[1]+'?v='+r['sha256'][:10],tile)
        return re.sub(r'<small>[\d.]+ ວິນາທີ</small>',f"<small>{r['duration']:.2f} ວິນາທີ · ElevenLabs</small>",tile)
    page.write_text(re.sub(r'<section class="tile">[\s\S]*?</section>',update_tile,content))
    sw=ROOT/'sw.js';sw.write_text(re.sub(r"const VERSION = '[^']+';","const VERSION = 'v25-school-elevenlabs';",sw.read_text(),count=1))
    run(sys.executable,ROOT/'tools/build-deck-14-prompts.py')
    print(json.dumps(dict(received=len(rows),imported=len(rows),seconds=round(sum(r['duration'] for r in rows),2),bytes=sum(r['bytes'] for r in rows),source='ElevenLabs, originals unchanged')))

if __name__=='__main__':main()
