// Exact QR preparation only: this helper preserves the supplied bank payload.
// The owner-verified amount format is implemented separately in build-payment-qrs.swift.
// swiftc tools/prepare-payment-qr.swift -o /tmp/prepare-payment-qr
// /tmp/prepare-payment-qr /absolute/path/to/bank-created-qr.png /absolute/path/to/output.png
import Foundation
import AppKit
import Vision
import CoreImage
import CryptoKit
struct Field {let id:String;let value:String;var encoded:String {id+String(format:"%02d",value.utf8.count)+value}}
func parse(_ text:String)throws->[Field]{
 let b=Array(text.utf8);guard b.allSatisfy({$0<128}) else {throw NSError(domain:"Unsupported QR encoding",code:1)}
 var i=0,result:[Field]=[],seen=Set<String>()
 while i<b.count {
  guard i+4<=b.count,let id=String(bytes:b[i..<i+2],encoding:.ascii),let length=Int(String(bytes:b[i+2..<i+4],encoding:.ascii)!),length>0,i+4+length<=b.count,!seen.contains(id) else {throw NSError(domain:"Invalid or duplicate QR fields",code:2)}
  let value=String(bytes:b[i+4..<i+4+length],encoding:.ascii)!;result.append(Field(id:id,value:value));seen.insert(id);i+=4+length
 }
 return result
}
func crc(_ value:String)->String {
 var n:UInt16=0xffff
 for byte in value.utf8 {n ^= UInt16(byte)<<8;for _ in 0..<8 {n=(n&0x8000) != 0 ? (n<<1)^0x1021 : n<<1}}
 return String(format:"%04X",n)
}
func scan(_ image:CGImage)throws->[String] {
 let request=VNDetectBarcodesRequest();request.symbologies=[.qr];request.usesCPUOnly=true
 try VNImageRequestHandler(cgImage:image,options:[:]).perform([request])
 return request.results?.compactMap{$0.payloadStringValue} ?? []
}
func render(_ value:String)throws->Data {
 let filter=CIFilter(name:"CIQRCodeGenerator")!;filter.setValue(Data(value.utf8),forKey:"inputMessage");filter.setValue("H",forKey:"inputCorrectionLevel")
 let image=filter.outputImage!,context=CIContext(options:[.useSoftwareRenderer:true]),raw=context.createCGImage(image,from:image.extent)!
 let scale=10,margin=40,side=raw.width*scale+margin*2
 let ctx=CGContext(data:nil,width:side,height:side,bitsPerComponent:8,bytesPerRow:side*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 ctx.setFillColor(NSColor.white.cgColor);ctx.fill(CGRect(x:0,y:0,width:side,height:side));ctx.interpolationQuality = .none
 ctx.draw(raw,in:CGRect(x:margin,y:margin,width:raw.width*scale,height:raw.height*scale));let result=ctx.makeImage()!
 guard try scan(result).contains(value) else {throw NSError(domain:"QR scan round-trip failed",code:3)}
 return NSBitmapImageRep(cgImage:result).representation(using:.png,properties:[:])!
}
let args=CommandLine.arguments
let original=NSImage(contentsOfFile:args[1])!;var bounds=NSRect(origin:.zero,size:original.size)
let input=original.cgImage(forProposedRect:&bounds,context:nil,hints:nil)!
let candidates=try scan(input)
guard candidates.count==1,let payload=candidates.first,payload.utf8.allSatisfy({$0<128}) else {fatalError("Expected one ASCII bank QR; do not alter ambiguous or binary payloads")}
try render(payload).write(to:URL(fileURLWithPath:args[2]))
print("Exact payload round-trip verified. Amount, if any, must already be supplied by the bank QR. No account data printed.")
