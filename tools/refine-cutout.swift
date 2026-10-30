// Apply an optional top-left normalized polygon to an existing transparent cutout.
// usage: refine-cutout input.png output.png [polygon.json]
// Prints the actual alpha bounding box for CUTS. Original pixels are preserved.
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
let a=CommandLine.arguments
let src=CGImageSourceCreateWithURL(URL(fileURLWithPath:a[1]) as CFURL,nil)!
let im=CGImageSourceCreateImageAtIndex(src,0,nil)!,w=im.width,h=im.height
let ctx=CGContext(data:nil,width:w,height:h,bitsPerComponent:8,bytesPerRow:w*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
if a.count>3 {
 let pts=try! JSONSerialization.jsonObject(with:Data(contentsOf:URL(fileURLWithPath:a[3]))) as! [[Double]]
 for (i,p) in pts.enumerated(){let pt=CGPoint(x:p[0]*Double(w),y:(1-p[1])*Double(h));if i==0{ctx.move(to:pt)}else{ctx.addLine(to:pt)}}
 ctx.closePath();ctx.clip()
}
ctx.draw(im,in:CGRect(x:0,y:0,width:w,height:h))
let data=ctx.data!.assumingMemoryBound(to:UInt8.self);var x0=w,y0=h,x1=0,y1=0
for y in 0..<h{for x in 0..<w{if data[(y*w+x)*4+3]>127{x0=min(x0,x);y0=min(y0,y);x1=max(x1,x);y1=max(y1,y)}}}
let dest=CGImageDestinationCreateWithURL(URL(fileURLWithPath:a[2]) as CFURL,UTType.png.identifier as CFString,1,nil)!
CGImageDestinationAddImage(dest,ctx.makeImage()!,nil);CGImageDestinationFinalize(dest)
print(String(format:"[%.4f,%.4f,%.4f,%.4f]",Double(x0)/Double(w),Double(y0)/Double(h),Double(x1-x0+1)/Double(w),Double(y1-y0+1)/Double(h)))
