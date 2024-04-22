import Foundation
import KakaoSDKCommon
import KakaoSDKShare
import KakaoSDKTemplate
import React
import RNCKakaoCore
import SafariServices

@objc public class RNCKakaoShareManager: NSObject {
  @objc public static let shared = RNCKakaoShareManager()

  @objc public func shareCustom(
    _ templateId: Int64,
    useWebBrowserIfKakaoTalkNotAvailable: Bool,
    templateArgs: [String: String]?,
    serverCallbackArgs: [String: String]?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      self.runShare(
        templateId: templateId,
        useWebBrowserIfKakaoTalkNotAvailable: useWebBrowserIfKakaoTalkNotAvailable,
        templateArgs: templateArgs,
        serverCallbackArgs: serverCallbackArgs,
        resolve: resolve,
        reject: reject
      )
    }
  }

  @objc public func shareDefaultTemplate(
    _ dict: [String: Any],
    type: String,
    useWebBrowserIfKakaoTalkNotAvailable: Bool,
    serverCallbackArgs: [String: String]?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      self.runShare(
        defaultTemplate: dict,
        templateType: type,
        useWebBrowserIfKakaoTalkNotAvailable: useWebBrowserIfKakaoTalkNotAvailable,
        serverCallbackArgs: serverCallbackArgs,
        resolve: resolve,
        reject: reject
      )
    }
  }

  private func runShare(
    templateId: Int64? = nil,
    defaultTemplate: [String: Any?]? = nil,
    templateType: String? = nil,
    useWebBrowserIfKakaoTalkNotAvailable: Bool,
    templateArgs: [String: String]? = nil,
    serverCallbackArgs: [String: String]?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let callback = { (sharingResult: SharingResult?, error: Error?) in
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

    if ShareApi.isKakaoTalkSharingAvailable() {
      if let templateId {
        ShareApi.shared.shareCustom(
          templateId: templateId,
          templateArgs: templateArgs,
          serverCallbackArgs: serverCallbackArgs,
          completion: callback
        )
      } else if var defaultTemplate, let templateType {
        do {
          let templatable = try generateTemplatable(templateType, &defaultTemplate)
          ShareApi.shared.shareDefault(templatable: templatable, completion: callback)
        } catch {
          RNCKakaoUtil.reject(reject, error)
        }
      } else {
        RNCKakaoUtil.reject(reject, "templateId or defaultTemplate and templateClazz not passed")
      }
    } else if useWebBrowserIfKakaoTalkNotAvailable {
      if let templateId {
        if let url = ShareApi.shared.makeCustomUrl(
          templateId: templateId,
          templateArgs: templateArgs,
          serverCallbackArgs: serverCallbackArgs
        ) {
          let safariViewController = SFSafariViewController(url: url)
          safariViewController.modalTransitionStyle = .crossDissolve
          safariViewController.modalPresentationStyle = .overCurrentContext
          RNCKakaoUtil.presentViewController(safariViewController) { success in
            if success {
              resolve(42)
            } else {
              RNCKakaoUtil.reject(reject, "SFSafariViewController open failed")
            }
          }
        } else {
          RNCKakaoUtil.reject(reject, "makeCustomUrl failed")
        }
      } else if var defaultTemplate, let templateType {
        do {
          let templatable = try generateTemplatable(templateType, &defaultTemplate)

          if let url = ShareApi.shared.makeDefaultUrl(templatable: templatable) {
            let safariViewController = SFSafariViewController(url: url)
            safariViewController.modalTransitionStyle = .crossDissolve
            safariViewController.modalPresentationStyle = .overCurrentContext
            RNCKakaoUtil.presentViewController(safariViewController) { success in
              if success {
                resolve(42)
              } else {
                RNCKakaoUtil.reject(reject, "SFSafariViewController open failed")
              }
            }
          } else {
            RNCKakaoUtil.reject(reject, "makeDefaultUrl failed")
          }
        } catch {
          RNCKakaoUtil.reject(reject, error)
        }
      } else {
        RNCKakaoUtil.reject(reject, "templateId or defaultTemplate and templateClazz not passed")
      }
    } else {
      RNCKakaoUtil.reject(reject, "kakaotalk not available")
    }
  }

  private func generateTemplatable(
    _ type: String,
    _ defaultTemplate: inout [String: Any?]
  ) throws -> Templatable {
    defaultTemplate["objectType"] = type
    let json = try JSONSerialization.data(
      withJSONObject: defaultTemplate,
      options: .prettyPrinted
    )
    if type == "feed" {
      return try SdkJSONDecoder.custom.decode(FeedTemplate.self, from: json) as Templatable
    } else if type == "list" {
      return try SdkJSONDecoder.custom.decode(ListTemplate.self, from: json) as Templatable
    } else if type == "location" {
      return try SdkJSONDecoder.custom.decode(LocationTemplate.self, from: json) as Templatable
    } else if type == "commerce" {
      return try SdkJSONDecoder.custom.decode(CommerceTemplate.self, from: json) as Templatable
    } else if type == "text" {
      return try SdkJSONDecoder.custom.decode(TextTemplate.self, from: json) as Templatable
    } else if type == "calendar" {
      return try SdkJSONDecoder.custom.decode(CalendarTemplate.self, from: json) as Templatable
    } else {
      throw SdkError.ApiFailed(reason: .BadParameter, errorInfo: nil)
    }
  }
}
