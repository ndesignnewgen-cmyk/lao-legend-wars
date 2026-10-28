// Prepares the effect art (prompts/fx-art.txt) for the game. Writes PNG; convert with cwebp afterwards.
// usage:
//   swift fxart.swift light <in> <out.png> <maxside>          glow on black → transparent (alpha = brightest channel)
//   swift fxart.swift trim  <in.png> <out.png> <maxside>      crop a cut-out picture to its pixels and resize
//   swift fxart.swift split <in.png> <outprefix> <maxside>    one PNG per separate piece (petal sheet, sparkle sheet): <outprefix>-1.png …
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let a = CommandLine.arguments
guard a.count == 5, let maxSide = Int(a[4]) else { print("usage: light|trim|split in out maxside"); exit(1) }
let cs = CGColorSpace(name: CGColorSpace.sRGB)!

func load(_ p: String) -> CGImage {
  guard let s = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil), let i = CGImageSourceCreateImageAtIndex(s, 0, nil) else { print("ERR load \(p)"); exit(1) }
  return i
}
// premultiplied RGBA8 pixels of an image (optionally a crop of it), scaled so the longer side is at most maxSide
func pixels(_ img: CGImage, crop: CGRect? = nil) -> (Int, Int, [UInt8]) {
  let src = crop.flatMap { img.cropping(to: $0) } ?? img
  let k = min(1, Double(maxSide) / Double(max(src.width, src.height)))
  let w = max(1, Int((Double(src.width) * k).rounded())), h = max(1, Int((Double(src.height) * k).rounded()))
  var buf = [UInt8](repeating: 0, count: w * h * 4)
  let ctx = CGContext(data: &buf, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.interpolationQuality = .high
  ctx.draw(src, in: CGRect(x: 0, y: 0, width: w, height: h))
  return (w, h, buf)
}
func save(_ w: Int, _ h: Int, _ buf: [UInt8], _ out: String) {
  var b = buf
  let ctx = CGContext(data: &b, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  let d = CGImageDestinationCreateWithURL(URL(fileURLWithPath: out) as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(d, ctx.makeImage()!, nil); CGImageDestinationFinalize(d)
  print("OK \(out) \(w)x\(h)")
}
// black → clear: the brightest channel becomes the alpha, so the glow keeps its colour on any background
func lightToAlpha(_ buf: inout [UInt8]) {
  for i in stride(from: 0, to: buf.count, by: 4) {
    let m = Double(max(buf[i], buf[i + 1], buf[i + 2]))
    let al = max(0, min(1, (m - 10) / 235))          // the faint noise in the black goes fully clear
    let f = m > 0 ? al * 255 / m : 0                  // premultiplied colour = full-strength colour × alpha
    buf[i] = UInt8(min(255, Double(buf[i]) * f)); buf[i + 1] = UInt8(min(255, Double(buf[i + 1]) * f)); buf[i + 2] = UInt8(min(255, Double(buf[i + 2]) * f))
    buf[i + 3] = UInt8(al * 255)
  }
}
// boxes (in full-size pixels, origin top-left) of the separate pieces, found on a quarter-size alpha map
func pieces(_ img: CGImage, light: Bool) -> ([CGRect], [Int], Int) {
  let sw = img.width / 4, sh = img.height / 4
  var buf = [UInt8](repeating: 0, count: sw * sh * 4)
  let ctx = CGContext(data: &buf, width: sw, height: sh, bitsPerComponent: 8, bytesPerRow: sw * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: sw, height: sh))
  var on = [Bool](repeating: false, count: sw * sh), seen = on, label = [Int](repeating: -1, count: sw * sh)
  for i in 0..<(sw * sh) { on[i] = light ? max(buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]) > 40 : buf[i * 4 + 3] > 40 }
  var boxes: [CGRect] = []
  for s in 0..<(sw * sh) where on[s] && !seen[s] {
    var st = [s], x0 = sw, y0 = sh, x1 = 0, y1 = 0, n = 0, mine: [Int] = []; seen[s] = true
    while let p = st.popLast() {
      let x = p % sw, y = p / sw; n += 1; mine.append(p); x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y)
      for (dx, dy) in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)] {
        let nx = x + dx, ny = y + dy; if nx < 0 || ny < 0 || nx >= sw || ny >= sh { continue }
        let q = ny * sw + nx; if on[q] && !seen[q] { seen[q] = true; st.append(q) }
      }
    }
    if n > 12 { for q in mine { label[q] = boxes.count }; boxes.append(CGRect(x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1)) }
  }
  // a sparkle's soft glow reaches well past its bright core: grow each box, then sort top-left to bottom-right
  let pad = light ? 0.9 : 0.04
  let grown = boxes.map { b in
    let px = b.width * pad, py = b.height * pad
    return CGRect(x: max(0, (b.minX - px) * 4), y: max(0, (b.minY - py) * 4), width: min(Double(img.width), (b.maxX + px) * 4) - max(0, (b.minX - px) * 4), height: min(Double(img.height), (b.maxY + py) * 4) - max(0, (b.minY - py) * 4))
  }
  return (grown, label, sw)
}
// the box around the visible pixels
func bounds(_ w: Int, _ h: Int, _ buf: [UInt8]) -> CGRect {
  var x0 = w, y0 = h, x1 = -1, y1 = -1
  for y in 0..<h { for x in 0..<w where buf[(y * w + x) * 4 + 3] > 8 { x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y) } }
  return x1 < 0 ? CGRect(x: 0, y: 0, width: w, height: h) : CGRect(x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1)
}

let img = load(a[2])
switch a[1] {
case "light":
  var (w, h, buf) = pixels(img); lightToAlpha(&buf); save(w, h, buf, a[3])
case "trim":
  // find the box at full size, then crop and scale in one step
  let full = maxSide
  let (w, h, buf) = { () -> (Int, Int, [UInt8]) in
    var b = [UInt8](repeating: 0, count: img.width * img.height * 4)
    let c = CGContext(data: &b, width: img.width, height: img.height, bitsPerComponent: 8, bytesPerRow: img.width * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    c.draw(img, in: CGRect(x: 0, y: 0, width: img.width, height: img.height)); return (img.width, img.height, b) }()
  let r = bounds(w, h, buf).insetBy(dx: -4, dy: -4).intersection(CGRect(x: 0, y: 0, width: w, height: h))
  _ = full; let (cw, ch, cb) = pixels(img, crop: r); save(cw, ch, cb, a[3])
case "split":
  let light = !(img.alphaInfo == .premultipliedLast || img.alphaInfo == .last || img.alphaInfo == .premultipliedFirst || img.alphaInfo == .first)
  let (boxes, label, sw) = pieces(img, light: light), sh = img.height / 4
  for (i, r) in boxes.enumerated() {
    var (w, h, buf) = pixels(img, crop: r); if light { lightToAlpha(&buf) }
    // clear whatever belongs to a neighbouring piece that reaches into this box
    if !light { let k = Double(w) / r.width
      for y in 0..<h { for x in 0..<w {
        let qx = Int((r.minX + Double(x) / k) / 4), qy = Int((r.minY + Double(y) / k) / 4); var near = false
        for dy in -2...2 { for dx in -2...2 { let nx = qx + dx, ny = qy + dy
          if nx >= 0, ny >= 0, nx < sw, ny < sh, label[ny * sw + nx] == i { near = true } } }
        if !near { for c in 0..<4 { buf[(y * w + x) * 4 + c] = 0 } } } } }
    save(w, h, buf, a[3] + "-\(i + 1).png")
  }
default: print("unknown mode"); exit(1)
}
