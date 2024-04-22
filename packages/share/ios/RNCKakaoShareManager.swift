import Foundation
import KakaoSDKShare
import React
import RNCKakaoCore
import SafariServices

@objc public class RNCKakaoShareManager: NSObject {
  @objc public static let shared = RNCKakaoShareManager()

  @objc public func shareCustom(
    _ templateId: Int64,
    useWebBrowserIfKakaoTalkNotAvailable: Bool,
    templateArgs: [String: String],
    serverCallbackArgs: [String: String],
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      // 카카오톡 설치여부 확인
      if ShareApi.isKakaoTalkSharingAvailable() {
        // 카카오톡으로 카카오톡 공유 가능
        ShareApi.shared.shareCustom(
          templateId: templateId,
          templateArgs: templateArgs,
          serverCallbackArgs: serverCallbackArgs
        ) { sharingResult, error in
          if let error {
            RNCKakaoUtil.reject(reject, error)
          } else if let sharingResult {
            UIApplication.shared.open(sharingResult.url, options: [:]) { success in
              if success {
                resolve(42)
              } else {
                RNCKakaoUtil.reject(reject, "sharingResult url open failed \(sharingResult.url)")
              }
            }
          } else {
            RNCKakaoUtil.reject(reject, "sharingResult url not found")
          }
        }
      } else if useWebBrowserIfKakaoTalkNotAvailable {
        if let url = ShareApi.shared.makeCustomUrl(
          templateId: templateId,
          templateArgs: templateArgs,
          serverCallbackArgs: serverCallbackArgs
        ) {
          let safariViewController = SFSafariViewController(url: url)
          safariViewController.modalTransitionStyle = .crossDissolve
          safariViewController.modalPresentationStyle = .overCurrentContext
          RNCKakaoUtil.presentViewController(safariViewController) {
            resolve(42)
          }
        } else {
          RNCKakaoUtil.reject(reject, "makeCustomUrl failed")
        }
      } else {
        RNCKakaoUtil.reject(reject, "kakaotalk not available")
      }
    }
  }
}
