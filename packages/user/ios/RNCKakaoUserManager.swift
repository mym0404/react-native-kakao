import Foundation
import KakaoSDKAuth
import KakaoSDKCommon
import KakaoSDKUser
import React
import RNCKakaoCore

@objc public class RNCKakaoUserManager: NSObject {
  @objc public static let shared = RNCKakaoUserManager()

  @objc(isKakaoTalkLoginUrl:) public static func isKakaoTalkLoginUrl(url: URL) -> Bool {
    guard let _ = try? KakaoSDK.shared.appKey() else { return false }
    return AuthApi.isKakaoTalkLoginUrl(url)
  }

  @objc(handleOpenUrl:) public static func handleOpenUrl(url: URL) -> Bool {
    guard let _ = try? KakaoSDK.shared.appKey() else { return false }
    return AuthController.handleOpenUrl(url: url)
  }

  @objc(isKakaoTalkLoginAvailable:reject:) public func isKakaoTalkLoginAvailable(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(UserApi.isKakaoTalkLoginAvailable())
  }

  @objc(loginWithKakaoTalk:resolve:reject:) public func loginWithKakaoTalk(
    serviceTerms: [String]? = nil,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let _ = try? KakaoSDK.shared.appKey() else {
      RNCKakaoUtil.reject(reject, "KakaoSdk is not initialized")
      return
    }
    if UserApi.isKakaoTalkLoginAvailable() {
      UserApi.shared.loginWithKakaoTalk(serviceTerms: serviceTerms) { token, error in
        if let error {
          RNCKakaoUtil.reject(reject, error)
        } else if let token {
          resolve([
            "accessToken": token.accessToken,
            "refreshToken": token.refreshToken,
            "tokenType": token.tokenType,
            "idToken": token.idToken as Any,
            "accessTokenExpiresAt": token.expiredAt,
            "refreshTokenExpiresAt": token.refreshTokenExpiredAt,
            "accessTokenExpiresIn": token.expiresIn,
            "refreshTokenExpiresIn": token.refreshTokenExpiresIn
          ])
        } else {
          RNCKakaoUtil.reject(reject, "token not found")
        }
      }
    } else {
      RNCKakaoUtil.reject(reject, "isKakaoTalkLoginAvailable returns false")
    }
  }

  @objc(loginWithKakaoAccount:resolve:reject:) public func loginWithKakaoAccount(
    prompts: [String]? = nil,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let _ = try? KakaoSDK.shared.appKey() else {
      RNCKakaoUtil.reject(reject, "KakaoSdk is not initialized")
      return
    }
    var _prompts: [Prompt]? = nil
    if let prompts {
      _prompts = []
      prompts.forEach { p in
        if p == "Login" {
          _prompts!.append(.Login)
        }
        if p == "Cert" {
          _prompts!.append(.Cert)
        }
        if p == "Create" {
          _prompts!.append(.Create)
        }
        if p == "UnifyDaum" {
          _prompts!.append(.UnifyDaum)
        }
      }
    }
    UserApi.shared.loginWithKakaoAccount(prompts: _prompts) { token, error in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if let token {
        resolve([
          "accessToken": token.accessToken,
          "refreshToken": token.refreshToken,
          "tokenType": token.tokenType,
          "idToken": token.idToken as Any,
          "accessTokenExpiresAt": token.expiredAt,
          "refreshTokenExpiresAt": token.refreshTokenExpiredAt,
          "accessTokenExpiresIn": token.expiresIn,
          "refreshTokenExpiresIn": token.refreshTokenExpiresIn
        ])
      } else {
        RNCKakaoUtil.reject(reject, "token not found")
      }
    }
  }
}
