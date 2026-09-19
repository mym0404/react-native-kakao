import Foundation
import KakaoSDKAuth
import KakaoSDKFriend
import KakaoSDKFriendCore
import KakaoSDKTalk
import KakaoSDKUser
import React
import RNCKakaoCore

@objc public class RNCKakaoSocialManager: NSObject {
  @objc public static let shared = RNCKakaoSocialManager()

  @objc public func getProfile(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      TalkApi.shared.profile { profile, error in
        if let error {
          RNCKakaoUtil.reject(reject, error)
        } else if let profile {
          resolve([
            "nickname": profile.nickname as Any,
            "countryISO": profile.countryISO as Any,
            "profileImageUrl": profile.profileImageUrl?.absoluteString as Any,
            "thumbnailUrl": profile.thumbnailUrl?.absoluteString as Any
          ])
        } else {
          RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "profile"))
        }
      }
    }
  }

  @objc public func selectFriends(
    _ multiple: Bool,
    mode: String,
    options: [String: Any],
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      let orientation: PickerOrientation = switch options["orientation"] {
      case let x as String where x == "landscape": .landscape
      case let x as String where x == "portrait": .portrait
      default: .auto
      }
      let params = OpenPickerFriendRequestParams(
        viewAppearance: .init(rawValue: options["viewAppearance"] as? String ?? "auto") ?? .auto,
        orientation: orientation,
        enableSearch: options["enableSearch"] as? Bool ?? true,
        showMyProfile: options["showMyProfile"] as? Bool ?? true,
        showFavorite: options["showFavorite"] as? Bool ?? true,
        showPickedFriend: options["showPickedFriend"] as? Bool ?? true,
        selectParams: multiple
          ? .friend(
            selectionMode: .multiple,
            minPickableCount: options["minPickableCount"] as? Int ?? 1,
            maxPickableCount: options["maxPickableCount"] as? Int ?? 30
          )
          : .friend(selectionMode: .single)
      )
      let callback = { (users: SelectedUsers?, error: Error?) in
        if let error {
          RNCKakaoUtil.reject(reject, error)
        } else if let users {
          resolve([
            "totalCount": users.totalCount,
            "users": users.users?.map {
              [
                "uuid": $0.uuid,
                "id": $0.id as Any,
                "favorite": $0.favorite as Any,
                "profileNickname": $0.profileNickname as Any,
                "profileThumbnailImage": $0.profileThumbnailImage as Any
              ]
            } ?? []
          ])
        } else {
          RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "users"))
        }
      }
      PickerApi.shared.selectFriend(
        params: params,
        viewType: mode == "popup" ? .popup : .full,
        completion: callback
      )
    }
  }

  @objc public func getFriends(
    options: [String: Any],
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let order: Order? = switch options["order"] {
    case let x as String where x == "asc": .Asc
    case let x as String where x == "desc": .Desc
    default: nil
    }
    let friendOrder: FriendOrder? = switch options["friendOrder"] {
    case let x as String where x == "nickname": .Nickname
    case let x as String where x == "age": .Age
    case let x as String where x == "favorite": .Favorite
    default: nil
    }

    onMain {
      TalkApi.shared
        .friends(
          offset: options["offset"] as? Int,
          limit: options["limit"] as? Int,
          order: order,
          friendOrder: friendOrder
        ) { friends, error in
          if let error {
            RNCKakaoUtil.reject(reject, error)
          } else if let friends, let items = friends.elements {
            resolve([
              "totalCount": friends.totalCount,
              "favoriteCount": friends.favoriteCount as Any,
              "friends": items
                .map {
                  [
                    "id": $0.id as Any,
                    "uuid": $0.uuid,
                    "profileNickname": $0.profileNickname as Any,
                    "profileThumbnailImage": $0.profileThumbnailImage as Any,
                    "favorite": $0.favorite as Any,
                    "allowedMsg": $0.allowedMsg as Any
                  ]
                }
            ])
          } else {
            RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "friends"))
          }
        }
    }
  }
}

// /// 친구 피커 모드
// final public let viewAppearance: KakaoSDKFriendCore.ViewAppearance?
// /// 친구 피커의 방향
// final public let orientation: KakaoSDKFriendCore.PickerOrientation?
// /// 친구 검색 기능 사용 여부
// final public let enableSearch: Bool?
// /// 내 프로필 표시 여부
// final public let showMyProfile: Bool?
// /// 즐겨찾기 친구 표시 여부
// final public let showFavorite: Bool?
// /// 선택한 친구 표시 여부 (멀티 피커에만 사용 가능)
// public var showPickedFriend: Bool?
// /// 선택 가능한 친구 수의 최대값
// public var maxPickableCount: Int?
// /// 선택 가능한 친구 수의 최소값
// public var minPickableCount: Int?
