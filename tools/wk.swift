// Safari check: load a page in WebKit (the Safari engine) at a given size, run an async JS snippet (it may use await and return a value), print the result.
// usage: swiftc -O tools/wk.swift -o /tmp/wk && /tmp/wk http://localhost:8768/?v=1 1000 540 test.js [snapshot.png]
import Cocoa
import WebKit

let args = CommandLine.arguments
let url = URL(string: args[1])!, w = Double(args[2])!, h = Double(args[3])!
let js = try! String(contentsOfFile: args[4], encoding: .utf8)
let png = args.count > 5 ? args[5] : nil

class D: NSObject, WKNavigationDelegate {
  let wv: WKWebView
  init(_ wv: WKWebView){ self.wv = wv }
  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    webView.callAsyncJavaScript(js, arguments: [:], in: nil, in: .page) { r in
      switch r {
      case .success(let v): print(v ?? "nil")
      case .failure(let e): print("JSERR", e)
      }
      if let png = png {
        webView.takeSnapshot(with: nil) { img, _ in
          if let img = img, let tiff = img.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff), let data = rep.representation(using: .png, properties: [:]) { try? data.write(to: URL(fileURLWithPath: png)) }
          exit(0)
        }
      } else { exit(0) }
    }
  }
}
let app = NSApplication.shared
let win = NSWindow(contentRect: NSRect(x: 0, y: 0, width: w, height: h), styleMask: [.borderless], backing: .buffered, defer: false)
let wv = WKWebView(frame: NSRect(x: 0, y: 0, width: w, height: h))
win.contentView = wv
win.orderBack(nil)
let d = D(wv); wv.navigationDelegate = d
wv.load(URLRequest(url: url))
DispatchQueue.main.asyncAfter(deadline: .now() + 120) { print("TIMEOUT"); exit(1) }
app.run()
