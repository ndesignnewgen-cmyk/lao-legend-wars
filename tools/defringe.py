# usage: python3 tools/defringe.py source.jpg vision-cutout.png out.png width height  (cutout from tools/cutout.swift)
# Remove the white background left along a cutout's edge: re-estimate alpha in a thin band at the outline from how
# white each pixel is compared with the nearby solid colour, and take the white out of the edge colours.
import sys, subprocess, numpy as np
from scipy import ndimage as nd
src, cut, out, W, H = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
rd = lambda p, f: np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-f','rawvideo','-pix_fmt',f,'-'],capture_output=True).stdout,np.uint8)
C = rd(src,'rgb24').reshape(H,W,3).astype(np.float32)
A0 = rd(cut,'rgba').reshape(H,W,4)[...,3].astype(np.float32)/255
# white pockets of background the subject finder kept (gaps between hair strands): pure, unsaturated white blobs
mn, mx = C.min(-1), C.max(-1)
white = (mn >= (float(sys.argv[6]) if len(sys.argv) > 6 else 232)) & (mx - mn <= 30)
lab, n = nd.label(white); size = nd.sum(white, lab, range(1, n + 1))
near_out = nd.binary_dilation(A0 < .5, iterations=int(sys.argv[7]) if len(sys.argv) > 7 else 40)
touch = nd.maximum(near_out, lab, range(1, n + 1))
thick = nd.maximum(nd.binary_opening(white, iterations=2), lab, range(1, n + 1))   # rim light along an outline is thin
pure = nd.mean(mn, lab, range(1, n + 1)) >= 241; flat = nd.mean(mx - mn, lab, range(1, n + 1)) <= 12.5   # paper white, not skin shine
pocket = np.isin(lab, 1 + np.nonzero((size >= 25) & (touch > 0) & (thick > 0) & pure & flat)[0])
pocket = nd.binary_dilation(pocket, iterations=1)
np.save(out + '.pocket.npy', pocket)
A0 = np.where(pocket, 0, A0)
solid = nd.binary_erosion(A0 > .97, iterations=10)
band = nd.binary_dilation(A0 > .02, iterations=3) & ~solid
# nearby solid colour: blur the solid pixels outward
F = np.zeros_like(C); wsum = np.zeros((H,W),np.float32); m = solid.astype(np.float32)
for s in (4, 10, 24, 60):
    num = np.stack([nd.gaussian_filter(C[...,k]*m, s) for k in range(3)], -1); den = nd.gaussian_filter(m, s)
    fill = (wsum < 1e-3) & (den > 1e-3); F[fill] = num[fill] / den[fill][:,None]; wsum[fill] = 1
F = np.minimum(F, 245)
# alpha from whiteness: C = a F + (1-a) 255  ->  a = (255-C)/(255-F), the most telling channel wins
a = ((255 - C) / np.maximum(255 - F, 10)).max(-1).clip(0, 1)
a = np.where(band, np.minimum(a, nd.binary_dilation(A0 > .02, iterations=2)), 0)
a = np.where(solid, 1, a)
# anything the background cannot reach without crossing the outline is the character (white rim light inside the edge)
outside0 = A0 < .02
passable = ~nd.binary_closing((a >= .35) | solid, iterations=2)   # small breaks in the outline are sealed
lab2, n2 = nd.label(passable | outside0)
reach = np.isin(lab2, np.unique(lab2[outside0 | pocket]))
a = np.where(band & ~reach & ~pocket, 1, a)
# small see-through holes inside the character (not the white gaps in the hair) are filled
core = a >= .5; holes = nd.binary_fill_holes(core) & ~core
lab3, n3 = nd.label(holes); sz3 = nd.sum(holes, lab3, range(1, n3 + 1)); pk3 = nd.maximum(pocket, lab3, range(1, n3 + 1))
a = np.where(np.isin(lab3, 1 + np.nonzero((sz3 < 600) & (pk3 == 0))[0]), 1, a)
a_raw = a.copy()
a = ((a - .1) / .9).clip(0, 1)                    # JPEG noise in the white is not a faint edge
a = nd.gaussian_filter(a, .6) * (a > 0)          # a soft, not stair-stepped, edge
a[solid] = 1
# take the white out of the edge colours
aa = np.maximum(a_raw, 1e-3)[...,None]
Fc = ((C - (1 - aa) * 255) / aa).clip(0, 255)
Fc = np.where((a_raw < .35)[...,None], F, Fc)
rgb = np.where(band[...,None], Fc, C)
o = np.dstack([rgb, a[...,None]*255]).clip(0,255).astype(np.uint8)
subprocess.run(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',f'{W}x{H}','-i','-',out],input=o.tobytes(),check=True)
print('kept', round(float((a>.5).mean()),3), 'band px', int(band.sum()))
