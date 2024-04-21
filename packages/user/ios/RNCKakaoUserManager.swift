import Foundation
import KakaoSDKAuth
import KakaoSDKCommon
import KakaoSDKUser
import React
import RNCKakaoCore

@objc public class RNCKakaoUserManager: NSObject {
  @objc public static let shared = RNCKakaoUserManager()

  @objc public static func isKakaoTalkLoginUrl(_ url: URL) -> Bool {
    guard let _ = try? KakaoSDK.shared.appKey() else { return false }
    return AuthApi.isKakaoTalkLoginUrl(url)
  }

  @objc public static func handleOpenUrl(_ url: URL) -> Bool {
    guard let _ = try? KakaoSDK.shared.appKey() else { return false }
    return AuthController.handleOpenUrl(url: url)
  }

  @objc public func isKakaoTalkLoginAvailable(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(UserApi.isKakaoTalkLoginAvailable())
  }

  @objc public func login(
    _ serviceTerms: [String],
    prompts: [String],
    useKakaoAccountLogin: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let _ = try? KakaoSDK.shared.appKey() else {
      RNCKakaoUtil.reject(reject, "KakaoSdk is not initialized")
      return
    }
    if UserApi.isKakaoTalkLoginAvailable(), !useKakaoAccountLogin {
      UserApi.shared
        .loginWithKakaoTalk(serviceTerms: emptyArrayToNil(serviceTerms)) { token, error in
          if let error {
            RNCKakaoUtil.reject(reject, error)
          } else if let token {
            resolve([
              "accessToken": token.accessToken,
              "refreshToken": token.refreshToken,
              "tokenType": token.tokenType,
              "idToken": token.idToken as Any,
              "accessTokenExpiresAt": token.expiredAt.timeIntervalSince1970,
              "refreshTokenExpiresAt": token.refreshTokenExpiredAt.timeIntervalSince1970,
              "accessTokenExpiresIn": token.expiresIn,
              "refreshTokenExpiresIn": token.refreshTokenExpiresIn,
              "scopes": token.scopes ?? []
            ])
          } else {
            RNCKakaoUtil.reject(reject, "token not found")
          }
        }
    } else {
      loginWithKakaoAccount(
        serviceTerms: serviceTerms,
        prompts: prompts,
        resolve: resolve,
        reject: reject
      )
    }
  }

  private func loginWithKakaoAccount(
    serviceTerms: [String]? = [],
    prompts: [String]? = [],
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let _ = try? KakaoSDK.shared.appKey() else {
      RNCKakaoUtil.reject(reject, "KakaoSdk is not initialized")
      return
    }
    var _prompts: [Prompt] = []
    if let prompts {
      prompts.forEach { p in
        if p == "Login" {
          _prompts.append(.Login)
        }
        if p == "Cert" {
          _prompts.append(.Cert)
        }
        if p == "Create" {
          _prompts.append(.Create)
        }
        if p == "UnifyDaum" {
          _prompts.append(.UnifyDaum)
        }
      }
    }
    UserApi.shared
      .loginWithKakaoAccount(
        prompts: emptyArrayToNil(_prompts),
        serviceTerms: emptyArrayToNil(serviceTerms)
      ) { token, error in
        if let error {
          RNCKakaoUtil.reject(reject, error)
        } else if let token {
          resolve([
            "accessToken": token.accessToken,
            "refreshToken": token.refreshToken,
            "tokenType": token.tokenType,
            "idToken": token.idToken as Any,
            "accessTokenExpiresAt": token.expiredAt.timeIntervalSince1970,
            "refreshTokenExpiresAt": token.refreshTokenExpiredAt.timeIntervalSince1970,
            "accessTokenExpiresIn": token.expiresIn,
            "refreshTokenExpiresIn": token.refreshTokenExpiresIn,
            "scopes": token.scopes ?? []
          ])
        } else {
          RNCKakaoUtil.reject(reject, "token not found")
        }
      }
  }

  @objc public func logout(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    UserApi.shared.logout { error in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else {
        resolve(42)
      }
    }
  }

  @objc public func unlink(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    UserApi.shared.unlink { error in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else {
        resolve(nil)
      }
    }
  }

  @objc public func isLogined(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    if AuthApi.hasToken() {
      UserApi.shared.accessTokenInfo { _, error in
        if let error {
          if let sdkError = error as? SdkError, sdkError.isInvalidTokenError() == true {
            resolve(false)
          } else {
            RNCKakaoUtil.reject(reject, error)
          }
        } else {
          resolve(true)
        }
      }
    } else {
      resolve(false)
    }
  }

  @objc public func scopes(
    _ scopes: [String]? = nil,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    UserApi.shared.scopes(scopes: emptyArrayToNil(scopes)) { scopeInfo, error in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if let scopes = scopeInfo?.scopes {
        resolve(scopes.map { s in
          [
            "id": s.id,
            "displayName": s.displayName,
            "type": s.type.rawValue,
            "using": s.using,
            "delegated": s.delegated as Any,
            "agreed": s.agreed,
            "revocable": s.revocable as Any
          ]
        })
      } else {
        RNCKakaoUtil.reject(reject, "scopes not found")
      }
    }
  }

  @objc public func revokeScopes(
    _ scopes: [String],
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    UserApi.shared.revokeScopes(scopes: scopes) { info, error in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if info != nil {
        resolve(42)
      } else {
        RNCKakaoUtil.reject(reject, "scopeInfo not found")
      }
    }
  }

  @objc public func serviceTerms(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    UserApi.shared.serviceTerms { serviceTerms, error in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if let serviceTerms {
        resolve(
          [
            "allowedServiceTerms": serviceTerms.allowedServiceTerms?.map {
              [
                "tag": $0.tag,
                "agreedAt": $0.agreedAt.timeIntervalSince1970
              ]
            },
            "appServiceTerms": serviceTerms.appServiceTerms?.map {
              [
                "tag": $0.tag,
                "createdAt": $0.createdAt.timeIntervalSince1970,
                "updatedAt": $0.updatedAt.timeIntervalSince1970
              ]
            }
          ]
        )
      } else {
        RNCKakaoUtil.reject(reject, "serviceTerms not found")
      }
    }
  }

  @objc public func shippingAddresses(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    UserApi.shared.shippingAddresses { s, error in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if let s {
        resolve([
          "userId": s.userId as Any,
          "needsAgreement": s.needsAgreement as Any,
          "shippingAddresses": s.shippingAddresses?.map {
            [
              "id": $0.id,
              "name": $0.name as Any,
              "isDefault": $0.isDefault,
              "updatedAt": $0.updatedAt?.timeIntervalSince1970 as Any,
              "type": $0.type?.rawValue as Any,
              "baseAddress": $0.baseAddress as Any,
              "detailAddress": $0.detailAddress as Any,
              "receiverName": $0.receiverName as Any,
              "receiverPhoneNumber1": $0.receiverPhoneNumber1 as Any,
              "receiverPhoneNumber2": $0.receiverPhoneNumber2 as Any,
              "zoneNumber": $0.zoneNumber as Any,
              "zipCode": $0.zipCode as Any
            ]
          } ?? []
        ])
      } else {
        RNCKakaoUtil.reject(reject, "shipping addresses not found")
      }
    }
  }

  @objc public func me(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    UserApi.shared.me { user, error in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if let user {
        resolve([
          "id": user.id as Any,
          "name": user.kakaoAccount?.name as Any,
          "email": user.kakaoAccount?.email as Any,
          "nickname": user.kakaoAccount?.profile?.nickname as Any,
          "profileImageUrl": user.kakaoAccount?.profile?.profileImageUrl?.absoluteString as Any,
          "thumbnailImageUrl": user.kakaoAccount?.profile?.thumbnailImageUrl?.absoluteString as Any,
          "phoneNumber": user.kakaoAccount?.phoneNumber as Any,
          "ageRange": user.kakaoAccount?.ageRange?.rawValue as Any,
          "birthday": user.kakaoAccount?.birthday as Any,
          "birthdayType": user.kakaoAccount?.birthdayType as Any,
          "birthyear": user.kakaoAccount?.birthyear as Any,
          "gender": user.kakaoAccount?.gender?.rawValue as Any,
          "isEmailValid": user.kakaoAccount?.isEmailValid as Any,
          "isEmailVerified": user.kakaoAccount?.isEmailVerified as Any,
          "isKorean": user.kakaoAccount?.isKorean as Any,
          "ageRangeNeedsAgreement": user.kakaoAccount?.ageRangeNeedsAgreement as Any,
          "birthdayNeedsAgreement": user.kakaoAccount?.birthdayNeedsAgreement as Any,
          "birthyearNeedsAgreement": user.kakaoAccount?.birthyearNeedsAgreement as Any,
          "emailNeedsAgreement": user.kakaoAccount?.emailNeedsAgreement as Any,
          "genderNeedsAgreement": user.kakaoAccount?.genderNeedsAgreement as Any,
          "isKoreanNeedsAgreement": user.kakaoAccount?.isKoreanNeedsAgreement as Any,
          "phoneNumberNeedsAgreement": user.kakaoAccount?.phoneNumberNeedsAgreement as Any,
          "profileNeedsAgreement": user.kakaoAccount?.profileNeedsAgreement as Any,
          "ciNeedsAgreement": user.kakaoAccount?.ciNeedsAgreement as Any,
          "nameNeedsAgreement": user.kakaoAccount?.nameNeedsAgreement as Any,
          "profileImageNeedsAgreement": user.kakaoAccount?.profileImageNeedsAgreement as Any,
          "profileNicknameNeedsAgreement": user.kakaoAccount?.profileNicknameNeedsAgreement as Any,
          "legalBirthDateNeedsAgreement": user.kakaoAccount?.legalBirthDateNeedsAgreement as Any
        ])
      } else {
        RNCKakaoUtil.reject(reject, "user not found")
      }
    }
  }

  private func emptyArrayToNil<T>(_ arr: [T]?) -> [T]? {
    if arr == nil || arr?.isEmpty == true { return nil }
    return arr
  }
}
