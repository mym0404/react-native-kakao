import Foundation
import KakaoSDKCommon
import KakaoSDKShare
import KakaoSDKTalk
import KakaoSDKTemplate
import React
import RNCKakaoCore
import SafariServices
import UIKit

@objc public class RNCKakaoShareManager: NSObject {
  @objc public static let shared = RNCKakaoShareManager()

  @objc public func isKakaoTalkSharingAvailable(_ resolve: @escaping RCTPromiseResolveBlock) {
    onMain {
      resolve(ShareApi.isKakaoTalkSharingAvailable())
    }
  }

  @objc public func uploadImage(
    _ imageUri: String,
    secureResource: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let maxImageBytes = 5 * 1024 * 1024
        let imageSizeError = "Image must be no larger than 5 MB"
        let data: Data
        if imageUri.hasPrefix("data:image/") {
          let parts = imageUri.split(separator: ",", maxSplits: 1, omittingEmptySubsequences: false)
          guard parts.count == 2, parts[0].hasSuffix(";base64") else {
            throw RNCKakaoError.unknown("Expected a base64 image data URI")
          }
          guard parts[1].utf8.count <= ((maxImageBytes + 2) / 3) * 4 else {
            throw RNCKakaoError.unknown(imageSizeError)
          }
          guard let decoded = Data(base64Encoded: String(parts[1])) else {
            throw RNCKakaoError.unknown("Expected a base64 image data URI")
          }
          data = decoded
        } else {
          let url = imageUri.hasPrefix("/") ? URL(fileURLWithPath: imageUri) : URL(string: imageUri)
          guard let url, url.isFileURL else {
            throw RNCKakaoError.unknown("Expected a local file or base64 image data URI")
          }
          let file = try FileHandle(forReadingFrom: url)
          defer { try? file.close() }
          data = try file.read(upToCount: maxImageBytes + 1) ?? Data()
        }
        guard data.count <= maxImageBytes else {
          throw RNCKakaoError.unknown(imageSizeError)
        }
        guard let image = UIImage(data: data) else {
          throw RNCKakaoError.unknown("Image file cannot be decoded")
        }
        onMain {
          ShareApi.shared
            .imageUpload(image: image, secureResource: secureResource) { result, error in
              if let error {
                RNCKakaoUtil.reject(reject, error)
              } else if let result {
                let original = result.infos.original
                resolve([
                  "infos": [
                    "original": [
                      "url": original.url.absoluteString,
                      "contentType": original.contentType,
                      "length": original.length,
                      "width": original.width,
                      "height": original.height
                    ]
                  ]
                ])
              } else {
                RNCKakaoUtil.reject(
                  reject,
                  RNCKakaoError.responseNotFound(name: "imageUploadResult")
                )
              }
            }
        }
      } catch {
        RNCKakaoUtil.reject(reject, error)
      }
    }
  }

  @objc public func shareScrapTemplate(
    _ requestUrl: String,
    useWebBrowserIfKakaoTalkNotAvailable: Bool,
    templateId: NSNumber?,
    templateArgs: [String: String]?,
    serverCallbackArgs: [String: String]?,
    pickerSettings: [String: Any]?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      self.runShare(
        templateType: "scrap",
        templateId: templateId?.int64Value,
        useWebBrowserIfKakaoTalkNotAvailable: useWebBrowserIfKakaoTalkNotAvailable,
        templateArgs: templateArgs,
        serverCallbackArgs: serverCallbackArgs,
        pickerSettings: pickerSettings,
        requestUrl: requestUrl,
        resolve: resolve,
        reject: reject
      )
    }
  }

  @objc public func scrapImage(
    _ imageUrl: String,
    secureResource: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let url = URL(string: imageUrl) else {
      RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("Invalid image URL"))
      return
    }
    onMain {
      ShareApi.shared.imageScrap(imageUrl: url, secureResource: secureResource) { result, error in
        if let error {
          RNCKakaoUtil.reject(reject, error)
        } else if let result {
          let original = result.infos.original
          resolve([
            "infos": [
              "original": [
                "url": original.url.absoluteString,
                "contentType": original.contentType,
                "length": original.length,
                "width": original.width,
                "height": original.height
              ]
            ]
          ])
        } else {
          RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "imageUploadResult"))
        }
      }
    }
  }

  @objc public func shareOrSendMeOrSendFriendOrWhatever(
    _ sendType: String,
    templateType: String,
    templateId: Int64,
    templateJson: [String: Any],
    receiverUuids: [String],
    useWebBrowserIfKakaoTalkNotAvailable: Bool,
    templateArgs: [String: String]?,
    serverCallbackArgs: [String: String]?,
    pickerSettings: [String: Any]?,
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
          pickerSettings: pickerSettings,
          resolve: resolve,
          reject: reject
        )
      } else if templateType == "scrap" {
        guard let requestUrl = templateJson["requestUrl"] as? String else {
          RNCKakaoUtil.reject(
            reject,
            RNCKakaoError.unknown("requestUrl is required for scrap messages")
          )
          return
        }
        let customTemplateId: Int64? = templateId == -1 ? nil : templateId
        if sendType == "send-me" {
          self.runSendMe(
            templateType: templateType,
            templateId: customTemplateId,
            templateArgs: templateArgs,
            resolve: resolve,
            reject: reject,
            requestUrl: requestUrl
          )
        } else if sendType == "send-friend" {
          self.runSendFriend(
            templateType: templateType,
            templateId: customTemplateId,
            receiverUuids: receiverUuids,
            templateArgs: templateArgs,
            resolve: resolve,
            reject: reject,
            requestUrl: requestUrl
          )
        } else {
          RNCKakaoUtil.reject(
            reject,
            RNCKakaoError.unknown("Unknown sendType for scrap messages: \(sendType)")
          )
        }
      } else {
        self.shareOrSendDefaultTemplate(
          sendType: sendType,
          templateType: templateType,
          dict: templateJson,
          receiverUuids: receiverUuids,
          useWebBrowserIfKakaoTalkNotAvailable: useWebBrowserIfKakaoTalkNotAvailable,
          serverCallbackArgs: serverCallbackArgs,
          pickerSettings: pickerSettings,
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
    pickerSettings: [String: Any]?,
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
        pickerSettings: pickerSettings,
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
        templateArgs: templateArgs,
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
    pickerSettings: [String: Any]?,
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
        pickerSettings: pickerSettings,
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
    reject: @escaping RCTPromiseRejectBlock,
    requestUrl: String? = nil
  ) {
    let sendCompletion = { (error: Error?) in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else {
        resolve(nil)
      }
    }

    if let requestUrl {
      TalkApi.shared.sendScrapMemo(
        requestUrl: requestUrl,
        templateId: templateId,
        templateArgs: templateArgs,
        completion: sendCompletion
      )
    } else if let templateId {
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
    reject: @escaping RCTPromiseRejectBlock,
    requestUrl: String? = nil
  ) {
    let sendCompletion = { (messageSendResult: MessageSendResult?, error: Error?) in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if let messageSendResult {
        resolve([
          "successfulReceiverUuids": messageSendResult.successfulReceiverUuids ?? [],
          "failureInfos": messageSendResult.failureInfos?.map { failure in
            [
              "code": failure.code,
              "msg": failure.msg,
              "receiverUuids": failure.receiverUuids
            ]
          } ?? []
        ])
      } else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("messageSendResult"))
      }
    }

    if let requestUrl {
      TalkApi.shared.sendScrapMessage(
        requestUrl: requestUrl,
        templateId: templateId,
        templateArgs: templateArgs,
        receiverUuids: receiverUuids,
        completion: sendCompletion
      )
    } else if let templateId {
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
    pickerSettings: [String: Any]?,
    requestUrl: String? = nil,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let shareCompletion = { (sharingResult: SharingResult?, error: Error?) in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if let sharingResult {
        UIApplication.shared.open(sharingResult.url, options: [:]) { success in
          if success {
            resolve(nil)
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
      let shareType = (pickerSettings?["type"] as? String).flatMap(ShareType.init(rawValue:))
      let limit = (pickerSettings?["limit"] as? NSNumber)?.intValue
      if let requestUrl {
        ShareApi.shared.shareScrap(
          requestUrl: requestUrl,
          templateId: templateId,
          templateArgs: templateArgs,
          shareType: shareType,
          limit: limit,
          serverCallbackArgs: serverCallbackArgs,
          completion: shareCompletion
        )
      } else if let templateId {
        ShareApi.shared.shareCustom(
          templateId: templateId,
          shareType: shareType,
          limit: limit,
          templateArgs: templateArgs,
          serverCallbackArgs: serverCallbackArgs,
          completion: shareCompletion
        )
      } else if var defaultTemplate {
        do {
          let templatable = try generateTemplatable(templateType, &defaultTemplate)
          ShareApi.shared.shareDefault(
            templatable: templatable,
            shareType: shareType,
            limit: limit,
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
      if let requestUrl {
        if let url = ShareApi.shared.makeScrapUrl(
          requestUrl: requestUrl,
          templateId: templateId,
          templateArgs: templateArgs,
          serverCallbackArgs: serverCallbackArgs
        ) {
          presentShareUrl(url)
        } else {
          RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("makeScrapUrl failed"))
        }
      } else if let templateId {
        if let url = ShareApi.shared.makeCustomUrl(
          templateId: templateId,
          templateArgs: templateArgs,
          serverCallbackArgs: serverCallbackArgs
        ) {
          presentShareUrl(url)
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
            presentShareUrl(url)
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

    func presentShareUrl(_ url: URL) {
      let safariViewController = SFSafariViewController(url: url)
      safariViewController.modalTransitionStyle = .crossDissolve
      safariViewController.modalPresentationStyle = .overCurrentContext
      RNCKakaoUtil.presentViewController(safariViewController) { success in
        if success {
          resolve(nil)
        } else {
          RNCKakaoUtil.reject(
            reject,
            RNCKakaoError.unknown("SFSafariViewController open failed")
          )
        }
      }
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
