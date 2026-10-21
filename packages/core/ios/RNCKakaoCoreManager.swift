import Foundation
import KakaoSDKCommon
import React

@objc public class RNCKakaoCoreManager: NSObject {
  @objc public static let shared = RNCKakaoCoreManager()

  override private init() {}

  @objc public func initializeKakaoSDK(
    _ appKey: String,
    loggingEnabled: Bool,
    customScheme: String?,
    resolve: @escaping RCTPromiseResolveBlock
  ) {
    onMain {
      KakaoSDK.initSDK(appKey: appKey, customScheme: customScheme, loggingEnable: loggingEnabled)
      resolve(nil)
    }
  }

  @objc public func getKakaoSDKInfo(_ resolve: @escaping RCTPromiseResolveBlock) {
    onMain {
      let sdk = KakaoSDK.shared
      var info: [String: Any] = [
        "version": sdk.sdkVersion(),
        "isInitialized": false,
        "loggingEnabled": sdk.isLoggingEnable()
      ]
      if let appKey = try? sdk.appKey() {
        info["isInitialized"] = true
        info["appKey"] = appKey
        info["kaHeader"] = sdk.kaHeader()
        info["redirectUri"] = sdk.redirectUri()
      }
      resolve(info)
    }
  }
}
