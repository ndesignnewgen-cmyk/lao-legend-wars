#!/usr/bin/env python3
# Makes art/foil/mask/<art>.png from art/cut/alt-*.webp: small masks that keep the special-art foil off the character.
# Run again after adding a new alt cutout (macOS: uses sips, no image library needed):  python3 tools/build-foil-masks.py
import glob, os, struct, subprocess, sys, tempfile, zlib
import numpy as np
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); WIDTH, FLOOR = 300, .1   # FLOOR: the faint foil left on the character

def read_png(path):
    b = open(path, 'rb').read(); i = 8; idat = b''
    while i < len(b):
        n = struct.unpack('>I', b[i:i+4])[0]; t = b[i+4:i+8]; d = b[i+8:i+8+n]; i += 12 + n
        if t == b'IHDR': w, h, depth, ctype = struct.unpack('>IIBB', d[:10])
        elif t == b'IDAT': idat += d
    ch = {6: 4, 2: 3}[ctype]; assert depth == 8
    raw = np.frombuffer(zlib.decompress(idat), 'u1'); stride = w * ch + 1; out = np.zeros((h, w * ch), 'i4'); prev = np.zeros(w * ch, 'i4')
    for y in range(h):
        f = raw[y * stride]; line = raw[y * stride + 1:(y + 1) * stride].astype('i4')
        if f == 2: line = (line + prev) % 256
        elif f == 1 or f == 3 or f == 4:
            cur = np.zeros(w * ch, 'i4')
            for x in range(w * ch):
                a = cur[x - ch] if x >= ch else 0; p = prev[x]; c = prev[x - ch] if x >= ch else 0
                if f == 1: pred = a
                elif f == 3: pred = (a + p) // 2
                else:
                    q = a + p - c; pa, pb, pc = abs(q - a), abs(q - p), abs(q - c); pred = a if pa <= pb and pa <= pc else (p if pb <= pc else c)
                cur[x] = (line[x] + pred) % 256
            line = cur
        out[y] = line; prev = line
    return out.reshape(h, w, ch)

def write_mask(path, alpha):
    h, w = alpha.shape; px = np.zeros((h, w, 2), 'u1'); px[..., 1] = alpha
    raw = b''.join(b'\0' + px[y].tobytes() for y in range(h)); ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d))
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 4, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw, 9)) + ch(b'IEND', b''))

os.makedirs(os.path.join(root, 'art/foil/mask'), exist_ok=True); total = 0
with tempfile.TemporaryDirectory() as tmp:
    for src in sorted(glob.glob(os.path.join(root, 'art/cut/alt-*.webp'))):
        name = os.path.basename(src)[:-5]; t = os.path.join(tmp, name + '.png')
        subprocess.run(['sips', '-s', 'format', 'png', '--resampleWidth', str(WIDTH), src, '--out', t], capture_output=True, check=True)
        px = read_png(t)
        if px.shape[2] != 4: sys.exit(name + ': cutout has no transparency')
        a = px[..., 3] / 255.
        for _ in range(2):   # soft edge so no hard line shows around the character
            a = (a + np.roll(a, 1, 0) + np.roll(a, -1, 0) + np.roll(a, 1, 1) + np.roll(a, -1, 1)) / 5
        keep = np.maximum(FLOOR, 1 - np.clip(a * 1.25, 0, 1))
        # some cutouts are cropped to the figure: find where it sits on the card art, and lay the mask out on the art's own shape
        art = os.path.join(tmp, name + '-art.png'); subprocess.run(['sips', '-s', 'format', 'png', '--resampleWidth', '132', os.path.join(root, 'art/w', name + '.webp'), '--out', art], capture_output=True, check=True)
        ap = read_png(art)[..., :3].astype('f4'); ah, aw = ap.shape[:2]; H = round(WIDTH * ah / aw)
        if abs(keep.shape[1] / keep.shape[0] - aw / ah) > .02:
            best = None; ch, cw = px.shape[:2]
            for tw in range(int(aw * .3), aw + 1, 3):
                th = round(tw * ch / cw)
                if th > ah or th < 8: continue
                yi = (np.arange(th) * ch / th).astype(int); xi = (np.arange(tw) * cw / tw).astype(int); t = px[yi][:, xi].astype('f4'); w = t[..., 3:] / 255
                if w.sum() < 30: continue
                for y in range(0, ah - th + 1, 2):
                    for x in range(0, aw - tw + 1, 2):
                        e = (((ap[y:y+th, x:x+tw] - t[..., :3]) ** 2).mean(2, keepdims=True) * w).sum() / w.sum()
                        if best is None or e < best[0]: best = (e, x / aw, y / ah, tw / aw, th / ah)
            e, fx, fy, fw, fh = best; print(name, 'placed at', round(fx, 2), round(fy, 2), 'size', round(fw, 2), round(fh, 2), 'error', round(float(e)))
            canvas = np.ones((H, WIDTH)); ty = int(fy * H); tx = int(fx * WIDTH); th = max(1, int(fh * H)); tw = max(1, int(fw * WIDTH))
            yi = (np.arange(th) * keep.shape[0] / th).astype(int); xi = (np.arange(tw) * keep.shape[1] / tw).astype(int)
            canvas[ty:ty+th, tx:tx+tw] = keep[yi][:, xi][:H - ty, :WIDTH - tx]
            if e > 500:   # could not find it: a soft gap in the middle is safer than a wrong shape
                yy, xx = np.mgrid[0:H, 0:WIDTH]; canvas = np.clip((((xx / WIDTH - .5) / .44) ** 2 + ((yy / H - .44) / .5) ** 2 - .4) * 1.6, FLOOR, 1); print(name, '-> soft gap')
            keep = canvas
        out = os.path.join(root, 'art/foil/mask', name + '.png'); write_mask(out, (np.round(keep * 15) * 17).astype('u1')); total += os.path.getsize(out)
print('masks written:', total // 1024, 'KB in all')
