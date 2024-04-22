import Foundation
import React
import RNCKakaoCore

@objc public class RNCKakaoNaviManager: NSObject {
  @objc public static let shared = RNCKakaoNaviManager()

  private func emptyArrayToNil<T>(_ arr: [T]?) -> [T]? {
    if arr == nil || arr?.isEmpty == true { return nil }
    return arr
  }
}
