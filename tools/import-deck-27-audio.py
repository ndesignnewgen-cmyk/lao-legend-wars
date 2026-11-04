"""Import the owner's ElevenLabs takes without modifying the MP3 originals.

Usage: python3 tools/import-deck-27-audio.py /path/to/downloads
Requires ffmpeg and ffprobe. Retains provenance, deduplicates identical files,
trims only outer silence, and uses peak-safe linear gain (no compression).
"""
from pathlib import Path
import concurrent.futures
import hashlib
import json
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Downloads'
FF = shutil.which('ffmpeg') or '/opt/homebrew/bin/ffmpeg'
PROBE = shutil.which('ffprobe') or '/opt/homebrew/bin/ffprobe'
TAKES = [
    ('dino-egg', 'A_small_dinosaur_egg_#3-1793751624029.mp3'),
    ('dino-hatch', 'A_dinosaur_egg_hatch_#3-1793751671244.mp3'),
    ('dino-grow', 'A_young_dinosaur_mag_#1-1793751735349.mp3'),
    ('dino-roar', 'One_majestic_fantasy_#1-1793751807911.mp3'),
    ('dino-roar-b', 'One_majestic_fantasy_#4-1793751814718.mp3'),
    ('dino-upgrade', 'Living_dinosaur_armo_#1-1793751889492.mp3'),
    ('dino-upgrade-b', 'Living_dinosaur_armo_#2-1793751878863.mp3'),
    ('dino-evolve', 'Ultimate_dinosaur_wa_#2-1793751942326.mp3'),
    ('dino-evolve-b', 'Ultimate_dinosaur_wa_#4-1793751973498.mp3'),
    ('dino-evolve-c', 'Ultimate_dinosaur_wa_#2-1793751984913.mp3'),
    ('dino-core', 'A_small_golden_fossi_#3-1793752046568.mp3'),
    ('dino-claw', 'One_fast_powerful_di_#1-1793752077553.mp3'),
    ('dino-sword', 'A_dinosaur_knight_sw_#4-1793752109061.mp3'),
    ('dino-shield', 'A_gold_and_ivory_din_#3-1793752146797.mp3'),
    ('dino-beam', 'One_golden_dinosaur__#4-1793752208057.mp3'),
    ('dino-heal', 'A_gentle_ancient_for_#1-1793752246941.mp3'),
]


def run(*args):
    return subprocess.run(args, capture_output=True, text=True, check=True)


def stats(path, filters='anull'):
    r = run(FF, '-hide_banner', '-nostats', '-i', str(path), '-af',
            filters + ',loudnorm=I=-20:TP=-3:LRA=9:print_format=json', '-f', 'null', '-')
    return json.loads(re.search(r'\{\s*"input_i"[\s\S]*?\}', r.stderr).group())


def duration(path):
    return float(run(PROBE, '-v', 'error', '-show_entries', 'format=duration',
                     '-of', 'default=nw=1:nk=1', str(path)).stdout)


def convert(row):
    key, name, digest = row
    source = SOURCE / name
    length = duration(source)
    log = run(FF, '-hide_banner', '-nostats', '-i', str(source), '-af',
              'silencedetect=noise=-50dB:d=0.1', '-f', 'null', '-').stderr
    events = [(k, float(v)) for k, v in re.findall(r'silence_(start|end): ([\d.]+)', log)]
    start, end = 0.0, length
    if len(events) >= 2 and events[0] == ('start', 0.0):
        start = max(0, events[1][1] - .015)
    if len(events) >= 2 and events[-1][0] == 'end' and abs(events[-1][1] - length) < .01:
        end = min(length, events[-2][1] + .08)
    trim = f'atrim=start={start:.6f}:end={end:.6f},asetpts=PTS-STARTPTS'
    measured = stats(source, trim)
    target = -19 if key.startswith(('dino-roar', 'dino-evolve')) else -20
    gain = min(target - float(measured['input_i']), -3 - float(measured['input_tp']))
    filters = (trim + f',volume={gain:.3f}dB,afade=t=in:d=0.002,'
               f'afade=t=out:st={max(0, end-start-.025):.6f}:d=0.025')
    dest = ROOT / 'art' / 'sfx' / (key + '.m4a')
    run(FF, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(source), '-map_metadata', '-1',
        '-af', filters, '-ar', '48000', '-ac', '2', '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart', str(dest))
    output = stats(dest)
    assert float(output['input_tp']) <= -1.5, (key, output)
    return dict(key=key, source=name, sourceSha256=digest, file=str(dest.relative_to(ROOT)),
                sha256=hashlib.sha256(dest.read_bytes()).hexdigest(), bytes=dest.stat().st_size,
                seconds=duration(dest), trimmedStart=round(start, 6), trimmedEnd=round(length-end, 6),
                gainDb=round(gain, 3), integratedLUFS=float(output['input_i']),
                truePeakDb=float(output['input_tp']))


if __name__ == '__main__':
    seen, unique, duplicates = {}, [], []
    for key, name in TAKES:
        digest = hashlib.sha256((SOURCE / name).read_bytes()).hexdigest()
        if digest in seen:
            duplicates.append(dict(source=name, sourceSha256=digest, sameAs=seen[digest]))
        else:
            seen[digest] = key
            unique.append((key, name, digest))
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
        files = list(ex.map(convert, unique))
    result = dict(deck=27, received=len(TAKES), uniqueRecordings=len(files),
                  processing='Outer silence trim; peak-safe linear gain; 2/25ms fades; AAC 128kbps 48k stereo. Originals unchanged.',
                  duplicates=duplicates, files=files)
    (ROOT / 'design' / 'deck-27-audio.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(received=len(TAKES), imported=len(files),
                         bytes=sum(x['bytes'] for x in files), duplicates=duplicates)))
