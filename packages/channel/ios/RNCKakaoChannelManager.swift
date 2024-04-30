import Foundation
import KakaoSDKTalk
import KakaoSDKUser
import React
import RNCKakaoCore
import SafariServices

@objc public class RNCKakaoChannelManager: NSObject {
  @objc public static let shared = RNCKakaoChannelManager()

  @objc public func followChannel(
    _ channelPublicId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      TalkApi.shared.followChannel(channelPublicId: channelPublicId) { followChannelResult, error in
        if let error {
          RNCKakaoUtil.reject(reject, error)
        } else if let followChannelResult {
          resolve(followChannelResult.success)
        } else {
          RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "followChannelResult"))
        }
      }
    }
  }

  @objc public func addChannel(
    _ channelPublicId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      TalkApi.shared.addChannel(channelPublicId: channelPublicId) { error in
        if let error {
          RNCKakaoUtil.reject(reject, error)
        } else {
          resolve(42)
        }
      }
    }
  }

  @objc public func getAddChannelUrl(
    _ channelPublicId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      guard let url = TalkApi.shared.makeUrlForAddChannel(channelPublicId: channelPublicId) else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("makeUrlForAddChannel failed"))
        return
      }
      resolve(url.absoluteString)
    }
  }

  @objc public func openAddChannelUrl(
    _ channelPublicId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      guard let url = TalkApi.shared.makeUrlForAddChannel(channelPublicId: channelPublicId)
      else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("makeUrlForAddChannel failed"))
        return
      }
      let safariVC = SFSafariViewController(url: url)
      safariVC.modalTransitionStyle = .crossDissolve
      safariVC.modalPresentationStyle = .overCurrentContext

      RNCKakaoUtil.presentViewController(safariVC) { success in
        if success {
          resolve(url.absoluteString)
        } else {
          RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("SFSafariViewController open failed"))
        }
      }
    }
  }

  @objc public func chatChannel(
    _ channelPublicId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      TalkApi.shared.chatChannel(channelPublicId: channelPublicId) { error in
        if let error {
          RNCKakaoUtil.reject(reject, error)
        } else {
          resolve(42)
        }
      }
    }
  }

  @objc public func getChatChannelUrl(
    _ channelPublicId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      guard let url = TalkApi.shared.makeUrlForChatChannel(channelPublicId: channelPublicId) else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("makeUrlForChatChannel failed"))
        return
      }
      resolve(url.absoluteString)
    }
  }

  @objc public func openChatChannelUrl(
    _ channelPublicId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      guard let url = TalkApi.shared.makeUrlForChatChannel(channelPublicId: channelPublicId)
      else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("makeUrlForChatChannel failed"))
        return
      }
      let safariVC = SFSafariViewController(url: url)
      safariVC.modalTransitionStyle = .crossDissolve
      safariVC.modalPresentationStyle = .overCurrentContext

      RNCKakaoUtil.presentViewController(safariVC) { success in
        if success {
          resolve(url.absoluteString)
        } else {
          RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("SFSafariViewController open failed"))
        }
      }
    }
  }

  @objc public func channels(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      TalkApi.shared.channels { channels, error in
        if let error {
          RNCKakaoUtil.reject(reject, error)
        } else if let channels = channels?.channels {
          resolve(channels.map { c in
            [
              "uuid": c.uuid,
              "encodedId": c.encodedId,
              "relation": c.relation.rawValue.lowercased(),
              "updateAt": c.updatedAt?.timeIntervalSince1970 as Any
            ]
          })
        } else {
          RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "channels"))
        }
      }
    }
  }
}
