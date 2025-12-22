import Foundation
import KakaoSDKCommon
import KakaoSDKShare
import KakaoSDKTalk
import KakaoSDKTemplate
import React
import RNCKakaoCore
import SafariServices

@objc public class RNCKakaoShareManager: NSObject {
  @objc public static let shared = RNCKakaoShareManager()

  @objc public func shareOrSendMeOrSendFriendOrWhatever(
    _ sendType: String,
    templateType: String,
    templateId: Int64,
    templateJson: [String: Any],
    receiverUuids: [String],
    useWebBrowserIfKakaoTalkNotAvailable: Bool,
    templateArgs: [String: String]?,
    serverCallbackArgs: [String: String]?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      if templateType == "custom" {
        self.shareOrSendCustom(
          sendType: sendType,
          templateType: templateType,
          templateId: templateId,
          receiverUuids: receiverUuids,
          useWebBrowserIfKakaoTalkNotAvailable: useWebBrowserIfKakaoTalkNotAvailable,
          templateArgs: templateArgs,
          serverCallbackArgs: serverCallbackArgs,
          resolve: resolve,
          reject: reject
        )
      } else {
        self.shareOrSendDefaultTemplate(
          sendType: sendType,
          templateType: templateType,
          dict: templateJson,
          receiverUuids: receiverUuids,
          useWebBrowserIfKakaoTalkNotAvailable: useWebBrowserIfKakaoTalkNotAvailable,
          serverCallbackArgs: serverCallbackArgs,
          resolve: resolve,
          reject: reject
        )
      }
    }
  }

  private func shareOrSendCustom(
    sendType: String,
    templateType: String,
    templateId: Int64,
    receiverUuids: [String],
    useWebBrowserIfKakaoTalkNotAvailable: Bool,
    templateArgs: [String: String]?,
    serverCallbackArgs: [String: String]?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    if sendType == "share" {
      runShare(
        templateType: templateType,
        templateId: templateId,
        useWebBrowserIfKakaoTalkNotAvailable: useWebBrowserIfKakaoTalkNotAvailable,
        templateArgs: templateArgs,
        serverCallbackArgs: serverCallbackArgs,
        resolve: resolve,
        reject: reject
      )
    } else if sendType == "send-me" {
      runSendMe(
        templateType: templateType,
        templateId: templateId,
        templateArgs: templateArgs,
        resolve: resolve,
        reject: reject
      )
    } else if sendType == "send-friend" {
      runSendFriend(
        templateType: templateType,
        templateId: templateId,
        receiverUuids: receiverUuids,
        resolve: resolve,
        reject: reject
      )
    } else {
      RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("Unknown sendType: \(sendType)"))
    }
  }

  private func shareOrSendDefaultTemplate(
    sendType: String,
    templateType: String,
    dict: [String: Any],
    receiverUuids: [String],
    useWebBrowserIfKakaoTalkNotAvailable: Bool,
    serverCallbackArgs: [String: String]?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    if sendType == "share" {
      runShare(
        templateType: templateType,
        defaultTemplate: dict,
        useWebBrowserIfKakaoTalkNotAvailable: useWebBrowserIfKakaoTalkNotAvailable,
        templateArgs: serverCallbackArgs,
        serverCallbackArgs: serverCallbackArgs,
        resolve: resolve,
        reject: reject
      )
    } else if sendType == "send-me" {
      runSendMe(templateType: templateType, defaultTemplate: dict, resolve: resolve, reject: reject)
    } else if sendType == "send-friend" {
      runSendFriend(
        templateType: templateType,
        defaultTemplate: dict,
        receiverUuids: receiverUuids,
        resolve: resolve,
        reject: reject
      )
    } else {
      RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("Unknown sendType: \(sendType)"))
    }
  }

  private func runSendMe(
    templateType: String,
    templateId: Int64? = nil,
    defaultTemplate: [String: Any?]? = nil,
    templateArgs: [String: String]? = nil,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let sendCompletion = { (error: Error?) in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else {
        resolve(42)
      }
    }

    if let templateId {
      TalkApi.shared.sendCustomMemo(
        templateId: templateId,
        templateArgs: templateArgs,
        completion: sendCompletion
      )
    } else if var defaultTemplate {
      do {
        let templatable = try generateTemplatable(templateType, &defaultTemplate)
        TalkApi.shared.sendDefaultMemo(templatable: templatable, completion: sendCompletion)
      } catch {
        RNCKakaoUtil.reject(reject, error)
      }
    } else {
      RNCKakaoUtil.reject(
        reject,
        RNCKakaoError.unknown("templateId or defaultTemplate not passed")
      )
    }
  }

  private func runSendFriend(
    templateType: String,
    templateId: Int64? = nil,
    defaultTemplate: [String: Any?]? = nil,
    receiverUuids: [String],
    templateArgs: [String: String]? = nil,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let sendCompletion = { (messageSendResult: MessageSendResult?, error: Error?) in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if let messageSendResult {
        resolve(messageSendResult.successfulReceiverUuids ?? [])
      } else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("messageSendResult"))
      }
    }

    if let templateId {
      TalkApi.shared.sendCustomMessage(
        templateId: templateId,
        templateArgs: templateArgs,
        receiverUuids: receiverUuids,
        completion: sendCompletion
      )
    } else if var defaultTemplate {
      do {
        let templatable = try generateTemplatable(templateType, &defaultTemplate)
        TalkApi.shared.sendDefaultMessage(
          templatable: templatable,
          receiverUuids: receiverUuids,
          completion: sendCompletion
        )
      } catch {
        RNCKakaoUtil.reject(reject, error)
      }
    } else {
      RNCKakaoUtil.reject(
        reject,
        RNCKakaoError.unknown("templateId or defaultTemplate not passed")
      )
    }
  }

  private func runShare(
    templateType: String,
    templateId: Int64? = nil,
    defaultTemplate: [String: Any?]? = nil,
    useWebBrowserIfKakaoTalkNotAvailable: Bool,
    templateArgs: [String: String]? = nil,
    serverCallbackArgs: [String: String]?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let shareCompletion = { (sharingResult: SharingResult?, error: Error?) in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if let sharingResult {
        UIApplication.shared.open(sharingResult.url, options: [:]) { success in
          if success {
            resolve(42)
          } else {
            RNCKakaoUtil.reject(
              reject,
              RNCKakaoError.unknown("sharingResult url open failed \(sharingResult.url)")
            )
          }
        }
      } else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "sharingResult"))
      }
    }

    if ShareApi.isKakaoTalkSharingAvailable() {
      if let templateId {
        ShareApi.shared.shareCustom(
          templateId: templateId,
          templateArgs: templateArgs,
          serverCallbackArgs: serverCallbackArgs,
          completion: shareCompletion
        )
      } else if var defaultTemplate {
        do {
          let templatable = try generateTemplatable(templateType, &defaultTemplate)
          ShareApi.shared.shareDefault(
            templatable: templatable,
            serverCallbackArgs: serverCallbackArgs,
            completion: shareCompletion
          )
        } catch {
          RNCKakaoUtil.reject(reject, error)
        }
      } else {
        RNCKakaoUtil.reject(
          reject,
          RNCKakaoError.unknown("templateId or defaultTemplate not passed")
        )
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
              RNCKakaoUtil.reject(
                reject,
                RNCKakaoError.unknown("SFSafariViewController open failed")
              )
            }
          }
        } else {
          RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("makeCustomUrl failed"))
        }
      } else if var defaultTemplate {
        do {
          let templatable = try generateTemplatable(templateType, &defaultTemplate)

          if let url = ShareApi.shared.makeDefaultUrl(
            templatable: templatable,
            serverCallbackArgs: serverCallbackArgs
          ) {
            let safariViewController = SFSafariViewController(url: url)
            safariViewController.modalTransitionStyle = .crossDissolve
            safariViewController.modalPresentationStyle = .overCurrentContext
            RNCKakaoUtil.presentViewController(safariViewController) { success in
              if success {
                resolve(42)
              } else {
                RNCKakaoUtil.reject(
                  reject,
                  RNCKakaoError.unknown("SFSafariViewController open failed")
                )
              }
            }
          } else {
            RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("makeDefaultUrl failed"))
          }
        } catch {
          RNCKakaoUtil.reject(reject, error)
        }
      } else {
        RNCKakaoUtil.reject(
          reject,
          RNCKakaoError.unknown("templateId or defaultTemplate not passed")
        )
      }
    } else {
      RNCKakaoUtil.reject(reject, RNCKakaoError.kakaoAppNotAvailable(app: .talk))
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
      throw RNCKakaoError.unknown("Unknown templateType: \(type)")
    }
  }
}
