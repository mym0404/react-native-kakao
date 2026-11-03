import UIKit

enum MapUnits {
  /// Kakao scales SDK pixels by screenScale / 2 before UIKit converts physical pixels to points.
  static var pixelsPerPoint: Double {
    let screenScale = Double(UIScreen.main.scale)
    let renderingScale = screenScale / 2
    return screenScale / renderingScale
  }

  static func pixels(_ points: Double) -> Double {
    points * pixelsPerPoint
  }

  static var imageRendererFormat: UIGraphicsImageRendererFormat {
    let format = UIGraphicsImageRendererFormat()
    format.scale = CGFloat(pixelsPerPoint)
    return format
  }
}
