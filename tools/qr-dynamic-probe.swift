// Local compatibility probe only. Never wired into checkout before owner bank-app verification.
// Exact QR preparation only. Never modify bank payloads: BCEL One ignored added EMV amount fields on the supplied LAPNET MyQR.
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
let source=NSImage(contentsOfFile:CommandLine.arguments[1])!;var rect=NSRect(origin:.zero,size:source.size)
let matches=try scan(source.cgImage(forProposedRect:&rect,context:nil,hints:nil)!)
guard matches.count==1 else {fatalError("Expected one original QR")}
let original=matches[0],fields=try parse(original),originalTags=Dictionary(uniqueKeysWithValues:fields.map{($0.id,$0.value)})
guard originalTags["53"]=="418",originalTags["58"]=="LA",fields.last?.id=="63",crc(String(original.dropLast(4)))==fields.last?.value else {fatalError("Original QR validation failed")}
var output:[Field]=[]
for field in fields where field.id != "54" && field.id != "63" {
 output.append(field.id=="01" ? Field(id:"01",value:"12") : field)
 if field.id=="53" {output.append(Field(id:"54",value:"10000"))}
}
let body=output.map{$0.encoded}.joined()+"6304",payload=body+crc(body)
let unchanged:(Field)->Bool={!["01","54","63"].contains($0.id)}
guard output.filter(unchanged).map({$0.encoded})==fields.filter(unchanged).map({$0.encoded}) else {fatalError("Recipient or currency changed")}
try render(payload).write(to:URL(fileURLWithPath:CommandLine.arguments[2]))
let report:[String:Any]=["probe":"dynamic-v2-10000","changed_fields":["01":"12","54":"10000","63":"recomputed"],"amount_lak":10000,"same_recipient_and_currency":true,"crc_valid":crc(String(payload.dropLast(4)))==String(payload.suffix(4)),"scan_round_trip":true,"bank_app_verified":false,"checkout_enabled":false]
let json=try JSONSerialization.data(withJSONObject:report,options:[.prettyPrinted,.sortedKeys]);try json.write(to:URL(fileURLWithPath:CommandLine.arguments[3]));print(String(data:json,encoding:.utf8)!)
