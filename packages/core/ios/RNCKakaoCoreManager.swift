import Foundation
import KakaoSDKCommon

@objc public class RNCKakaoCoreManager: NSObject {
  @objc public static let shared = RNCKakaoCoreManager()

  override private init() {}

  @objc public func initializeKakaoSDK(_ appKey: String) {
    KakaoSDK.initSDK(appKey: appKey)
  }
}
