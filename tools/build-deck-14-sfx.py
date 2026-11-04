#!/usr/bin/env python3
"""Original procedural sword/floral SFX, with reproducible seeds and ElevenLabs briefs.
No third-party recordings, voices, music, or external API calls.
"""
from pathlib import Path
import array, hashlib, json, math, random, subprocess, sys, wave

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'outputs/deck-14-cute-school-v4/sfx'
RATE=44100
CUES=[
 ('draw','ຊັກດາບ',.85,'One elegant Japanese katana draw: short dry sliding steel, delicate metallic ring, clean fast finish. Close-up anime game Foley, no voice or music.'),
 ('slash','ຟັນດາບເງິນ',.8,'One fast precise katana slash through air, silky sharp whoosh and a small bright metal glint. Light agile school sword heroine, no impact on flesh, no voice or music.'),
 ('double','ດາບຄູ່',1.15,'Two clearly separated quick katana and wakizashi air slashes, left then right, crisp crossed silver ringing finish. Agile anime sword combo, no voices, no music.'),
 ('guard','ໂລ້ຈຳປາ',1.3,'One rounded wooden practice shield block with a clean soft thock, followed by an airy magical glass shimmer blooming like a white plumeria flower. No harsh crash, voices or music.'),
 ('heal','ກີບຈຳປາຮັກສາ',1.9,'A gentle upward floral breeze, soft rustling petals and three delicate bright bell glints, warm reassuring healing magic. One short game cue, no music or voices.'),
 ('focus','ລວມຈິດດາບ',1.6,'Sword-spirit focus charging: a narrow airy rising shimmer, restrained silver overtones gathering to one clear bell ping. Refined magical focus cue, no engine, voice or music.'),
 ('training','ຝຶກດາບໄມ້',1.1,'Two light wooden bokken practice taps, dry polished wood with a brief air swish and soft room tail. Friendly modern school sword club, no voices or music.'),
 ('legend','ນາງຈຳປາອອກໂຕ',2.5,'A graceful legendary sword heroine entrance: silk wind sweeps up, a clear silver katana draw, then warm golden plumeria sparkle blooms. Luxurious anime game reveal, no voice, song, drums or explosion.'),
 ('dance','ຟ້ອນດາບດອກຈຳປາ',2.0,'Three elegant accelerating sword air sweeps spiraling through floating plumeria petals, final precise bright silver-gold cut and short crystal tail. Distinct rhythmic attacks, no voices or music.'),
 ('fusion','ຄູ່ດາບເດືອນເພັງ',2.7,'Two silvery magical streams converge from left and right, paired blade rings lock together, a soft moonlit crystal bloom finishes the fusion. Elegant airy anime transformation, no voice or music.'),
 ('ultimate','ເທວີດາບຈຳປາທອງ',3.2,'Ultimate golden plumeria sword awakening: a short low warm pulse, ascending silver and gold magical wind, two powerful clean air slashes, one radiant five-petal crystal bloom with shimmering decay. Majestic but gentle, no voices, music, gunfire or explosion.')
]

def make(ident,duration,seed):
    rng=random.Random(seed)
    n=int(duration*RATE)
    left=array.array('f',[0])*n;right=array.array('f',[0])*n
    def add(start,length,fn,gain=1,pan=0):
        a=max(0,int(start*RATE));b=min(n,a+int(length*RATE))
        gl=math.sqrt((1-pan)/2)*gain;gr=math.sqrt((1+pan)/2)*gain
        for i in range(a,b):
            t=(i-a)/RATE;v=fn(t,(i-a)/max(1,b-a))
            left[i]+=v*gl;right[i]+=v*gr
    def air(at,length,power=1,pan=0,sharp=False):
        low=0.;prev=0.
        def fn(t,u):
            nonlocal low,prev
            noise=rng.uniform(-1,1);low+=.055*(noise-low)
            high=noise-prev;prev=noise
            env=math.sin(math.pi*u)**(2.5 if sharp else 1.6)
            return (low*3.2+high*(.07 if sharp else .025))*env
        add(at,length,fn,power,pan)
    def chime(at,freq,length=.9,power=.15,pan=0):
        phases=[rng.random()*6.28 for _ in range(5)]
        ratios=[1,2.01,2.76,4.13,5.4];weights=[1,.4,.18,.1,.055]
        def fn(t,u):
            return (1-math.exp(-t*250))*math.exp(-t*6/length)*sum(w*math.sin(2*math.pi*freq*r*t+p) for r,w,p in zip(ratios,weights,phases))
        add(at,length,fn,power,pan)
    def slash(at,power=1,pan=0):
        air(at,.29,power,pan,True);chime(at+.10,1760,.55,.075*power,-pan)
    def tap(at,freq,power=.8):
        add(at,.17,lambda t,u:(math.sin(2*math.pi*freq*t)+.45*math.sin(2*math.pi*freq*2.63*t))*math.exp(-t*65)*(1-math.exp(-t*1800)),.3*power)
        air(at,.06,.25*power,sharp=True)
    if ident=='draw':
        air(.04,.4,.75,-.2,True);chime(.24,1318,.58,.26,.15)
    elif ident=='slash':slash(.05,1.25)
    elif ident=='double':slash(.04,1.1,-.65);slash(.30,1.2,.65)
    elif ident=='guard':tap(.04,185,1.2);air(.12,.65,.45);chime(.15,1046,1.05,.2);chime(.28,1568,.8,.08,.4)
    elif ident=='training':tap(.05,265);tap(.34,320);air(.5,.26,.55,.15)
    elif ident in ('heal','focus'):
        air(.08,duration*.65,.45)
        for i,f in enumerate([880,1174,1760] if ident=='heal' else [659,988,1976]):chime(.15+i*.22,f,duration*.65,.16/(1+i*.3),(i-1)*.45)
    elif ident=='legend':
        air(.02,1.1,.7,-.25);slash(.6,.8,.2)
        for i,f in enumerate([659,988,1318,1976]):chime(.85+i*.16,f,1.1,.15,(i-1.5)*.25)
    elif ident=='dance':
        for i,t in enumerate([.05,.42,.72]):slash(t,1+i*.15,[-.6,.6,0][i])
        chime(1.,1568,.9,.22)
    elif ident in ('fusion','ultimate'):
        air(.03,1.3,.7,-.4);air(.22,1.2,.55,.4)
        add(.04,.4,lambda t,u:math.sin(2*math.pi*(92*t-30*t*t))*math.sin(math.pi*u)**2,.2)
        slash(.8,.75,-.6);slash(1.05,.85,.6)
        for i,f in enumerate([523,784,1046,1568,2093]):chime(1.22+i*.12,f,1.2,.14,(i-2)*.25)
        if ident=='ultimate':air(1.25,.6,.75);chime(1.8,2637,1.25,.12)
    # Short natural stereo room reflections. No sustained music bed.
    for delay,level in [(int(.043*RATE),.12),(int(.079*RATE),.07)]:
        for i in range(n-1,delay-1,-1):
            left[i]+=right[i-delay]*level;right[i]+=left[i-delay]*level
    peak=max(max(abs(v) for v in left),max(abs(v) for v in right),.001)
    scale=.77/peak
    pcm=array.array('h')
    for i,(l,r) in enumerate(zip(left,right)):
        fade=min(1,i/(RATE*.006),(n-1-i)/(RATE*.07))
        pcm.extend([round(max(-1,min(1,v*scale*fade))*32767) for v in (l,r)])
    return pcm

def main():
    manifest=ROOT/'design/deck-14-audio.json'
    if manifest.exists() and any(r.get('source','').startswith('ElevenLabs') for r in json.loads(manifest.read_text())):
        sys.exit('Owner recordings are installed; procedural generation must not overwrite them.')
    OUT.mkdir(parents=True,exist_ok=True)
    records=[]
    for seed,(ident,name,duration,prompt) in enumerate(CUES,1400):
        stem='blade-'+ident;path=OUT/(stem+'.wav');pcm=make(ident,duration,seed)
        with wave.open(str(path),'wb') as w:w.setparams((2,2,RATE,0,'NONE','not compressed'));w.writeframes(pcm.tobytes())
        dest=ROOT/'art/sfx'/(stem+'.m4a')
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(path),'-c:a','aac','-b:a','160k','-movflags','+faststart',str(dest)],check=True)
        records.append(dict(id=ident,name=name,duration=duration,file=str(dest.relative_to(ROOT)),source='original procedural synthesis',seed=seed,prompt=prompt,peak=round(max(abs(v) for v in pcm)/32768,4),sha256=hashlib.sha256(dest.read_bytes()).hexdigest()))
    text='ເດັກ 14 · ພຣອມ SFX ສຳລັບ ElevenLabs\n\nສຽງທີ່ໃສ່ຢູ່ຕອນນີ້ແມ່ນສຽງສ້າງໃນເຄື່ອງ. ພຣອມດ້ານລຸ່ມໃຊ້ເຈນສຽງໃໝ່ໃນ ElevenLabs ເພື່ອປ່ຽນໄດ້. ເຈນແຍກເທື່ອລະສຽງ, ບໍ່ລວມເປັນໄຟລ໌ດຽວ.\n\n'+'\n\n'.join(f"{r['name']} · {r['duration']} s · blade-{r['id']}.mp3\n{r['prompt']}" for r in records)+'\n'
    (ROOT/'prompts/deck-14-sfx-elevenlabs.txt').write_text(text,encoding='utf-8-sig')
    (OUT/'ELEVENLABS-PROMPTS.txt').write_text(text,encoding='utf-8-sig')
    (OUT/'manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
    (ROOT/'design/deck-14-audio.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
    subprocess.run([sys.executable,ROOT/'tools/build-deck-14-prompts.py'],check=True)
    print(json.dumps(dict(sounds=len(records),seconds=sum(r['duration'] for r in records),bytes=sum((ROOT/r['file']).stat().st_size for r in records))))

if __name__=='__main__':main()
