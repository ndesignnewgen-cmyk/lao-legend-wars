// Makes the cutout for a card's summon showcase (needs macOS 14+).
// usage: swift tools/cutout.swift art/<img>.jpg /tmp/<img>.png
//        cwebp -q 84 -alpha_q 95 -exact /tmp/<img>.png -o art/cut/<img>.webp
// then add  <img>:[x,y,w,h]  (the four numbers it prints after OK and the coverage) to CUTS in index.html.
// Lifts the main subject(s) out of a picture with Vision and writes a same-size PNG with a transparent background.
// Prints: coverage (share of pixels kept) and the subject's bounding box as fractions (x y w h, origin top-left).
import Foundation
import Vision
import CoreImage
import ImageIO

let args = CommandLine.arguments
guard args.count == 3, let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("ERR load"); exit(1) }

let handler = VNImageRequestHandler(cgImage: img, options: [:])
let req = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([req]) } catch { print("ERR vision \(error)"); exit(1) }
guard let res = req.results?.first, !res.allInstances.isEmpty else { print("NONE"); exit(2) }

do {
  let buf = try res.generateMaskedImage(ofInstances: res.allInstances, from: handler, croppedToInstancesExtent: false)
  let ci = CIImage(cvPixelBuffer: buf)
  let ctx = CIContext()
  try ctx.writePNGRepresentation(of: ci, to: URL(fileURLWithPath: args[2]), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
  // coverage and bounding box from the mask itself
  let mask = try res.generateScaledMaskForImage(forInstances: res.allInstances, from: handler)
  CVPixelBufferLockBaseAddress(mask, .readOnly)
  let w = CVPixelBufferGetWidth(mask), h = CVPixelBufferGetHeight(mask), row = CVPixelBufferGetBytesPerRow(mask)
  let base = CVPixelBufferGetBaseAddress(mask)!.assumingMemoryBound(to: Float32.self)
  var on = 0, x0 = w, y0 = h, x1 = 0, y1 = 0
  for y in stride(from: 0, to: h, by: 2) { for x in stride(from: 0, to: w, by: 2) {
    if base[y * (row / 4) + x] > 0.5 { on += 1; x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y) } } }
  CVPixelBufferUnlockBaseAddress(mask, .readOnly)
  let cov = Double(on) / Double((w / 2) * (h / 2))
  print(String(format: "OK %.3f %.3f %.3f %.3f %.3f", cov, Double(x0) / Double(w), Double(y0) / Double(h), Double(x1 - x0) / Double(w), Double(y1 - y0) / Double(h)))
} catch { print("ERR mask \(error)"); exit(1) }
