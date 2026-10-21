import Foundation
import KakaoSDKAuth
import KakaoSDKCert
import KakaoSDKCommon
import React
import RNCKakaoCore

private let transactionIdKey = "txId"

@objc public class RNCKakaoCertManager: NSObject {
  @objc public static let shared = RNCKakaoCertManager()
  private var activeTalkSignature: UUID?

  @objc public static func isKakaoTalkSignReturnUrl(_ url: URL) -> Bool {
    CertApi.isKakaoTalkSignReturnUrl(url)
  }

  @objc public static func handleOpenUrl(_ url: URL) -> Bool {
    CertApi.handleOpenUrl(url: url)
  }

  @objc public func certLoginWithKakaoTalk(
    _ options: [String: Any],
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    login(options, isTalk: true, resolve: resolve, reject: reject)
  }

  @objc public func certLoginWithKakaoAccount(
    _ options: [String: Any],
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    login(options, isTalk: false, resolve: resolve, reject: reject)
  }

  @objc public func issueCertTokenWithCode(
    _ code: String,
    codeVerifier: String?,
    redirectUri: String?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain { [self] in
      guard let _ = try? KakaoSDK.shared.appKey() else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.sdkNotInitialized)
        return
      }
      AuthApi.shared.certToken(
        code: code,
        codeVerifier: codeVerifier,
        redirectUri: redirectUri ?? KakaoSDK.shared.redirectUri(),
        completion: tokenCallback(resolve, reject: reject)
      )
    }
  }

  private func login(
    _ options: [String: Any],
    isTalk: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    withCertType(options["certType"] as? String ?? "", reject: reject) { certType in
      guard isTalk || certType == .K2100 else {
        RNCKakaoUtil.reject(reject, SdkError(reason: .BadParameter))
        return
      }
      let prompts = (options["prompts"] as? [String])?.compactMap { value -> Prompt? in
        switch value {
        case "Login": .Login
        case "Create": .Create
        case "SelectAccount": .SelectAccount
        default: nil
        }
      }
      let identifyItems = (options["identifyItems"] as? [String])?
        .compactMap(IdentifyItem.init(rawValue:))
      let signData = options["signData"] as? String
      let settleId = options["settleId"] as? String
      let nonce = options["nonce"] as? String
      let callback = self.tokenCallback(resolve, reject: reject)
      if isTalk {
        let ios = options["ios"] as? [String: Any]
        CertApi.shared.certLoginWithKakaoTalk(
          certType: certType,
          txId: options[transactionIdKey] as? String,
          launchMethod: ios?["launchMethod"] as? String == "CustomScheme" ? .CustomScheme :
            .UniversalLink,
          prompts: prompts,
          channelPublicIds: options["channelPublicIds"] as? [String],
          serviceTerms: options["serviceTerms"] as? [String],
          signData: signData,
          nonce: nonce,
          settleId: settleId,
          identifyItems: identifyItems,
          completion: callback
        )
      } else {
        CertApi.shared.certLoginWithKakaoAccount(
          certType: certType,
          prompts: prompts,
          loginHint: options["loginHint"] as? String,
          signData: signData,
          nonce: nonce,
          settleId: settleId,
          identifyItems: identifyItems,
          completion: callback
        )
      }
    }
  }

  @objc public func publicKey(
    _ certType: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    withCertType(certType, reject: reject) { resolve(CertApi.shared.publicKey(certType: $0)) }
  }

  @objc public func sessionInfo(
    _ certType: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    withCertType(certType, reject: reject) { type in
      if let info = CertApi.shared.sessionInfo(certType: type) {
        resolve(self.mapSession(info))
      } else {
        resolve(nil)
      }
    }
  }

  @objc public func fetchSessionInfo(
    _ certType: String,
    txId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    withCertType(certType, reject: reject) { type in
      CertApi.shared.sessionInfo(
        certType: type,
        txId: txId,
        completion: self.sessionCallback(resolve, reject: reject)
      )
    }
  }

  @objc public func fetchSessionInfoByAppKey(
    _ certType: String,
    txId: String,
    targetAppKey: String?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    withCertType(certType, reject: reject) { type in
      CertApi.shared.sessionInfoByAppKey(
        certType: type,
        txId: txId,
        targetAppKey: targetAppKey,
        completion: self.sessionCallback(resolve, reject: reject)
      )
    }
  }

  @objc public func isValidSession(
    _ certType: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    withCertType(certType, reject: reject) { resolve(CertApi.shared.isValidSession(certType: $0)) }
  }

  @objc public func deleteKeyPair(
    _ certType: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    withCertType(certType, reject: reject) { type in
      CertApi.shared.deleteKeyPair(certType: type)
      resolve(nil)
    }
  }

  @objc public func reducedSign(
    _ certType: String,
    data: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    withCertType(certType, reject: reject) { type in
      CertApi.shared.reducedSign(certType: type, data: data) { signature, error in
        if let error {
          RNCKakaoUtil.reject(reject, error)
        } else if let signature {
          resolve(signature)
        } else {
          RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "signature"))
        }
      }
    }
  }

  @objc public func isKakaoTalkSignAvailable(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain { resolve(CertApi.isKakaoTalkSignAvailable()) }
  }

  @objc public func signWithKakaoTalk(
    _ txId: String,
    targetAppKey: String?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      guard self.activeTalkSignature == nil else {
        RNCKakaoUtil.reject(
          reject,
          SdkError(
            reason: .BadParameter,
            message: "A KakaoTalk signature request is already in progress."
          )
        )
        return
      }
      let requestId = UUID()
      self.activeTalkSignature = requestId
      CertApi.shared
        .signWithKakaoTalk(
          certType: .K3220,
          txId: txId,
          targetAppKey: targetAppKey
        ) { status, error in
          onMain {
            guard self.activeTalkSignature == requestId else { return }
            self.activeTalkSignature = nil
            CertApi.shared.certWithTalkCompletionHandler = nil
            if let error {
              RNCKakaoUtil.reject(reject, error)
            } else if let status {
              resolve([
                transactionIdKey: status.txId,
                "requestedAt": status.requestedAt?.timeIntervalSince1970 as Any,
                "requestExpiredAt": status.requestExpiredAt?.timeIntervalSince1970 as Any,
                "signedAt": status.signedAt?.timeIntervalSince1970 as Any
              ])
            } else {
              RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "signStatusInfo"))
            }
          }
        }
    }
  }

  private func withCertType(
    _ value: String,
    reject: @escaping RCTPromiseRejectBlock,
    operation: @escaping (CertType) -> Void
  ) {
    guard let type = CertType(rawValue: value.lowercased()) else {
      RNCKakaoUtil.reject(reject, SdkError(reason: .BadParameter))
      return
    }
    onMain { operation(type) }
  }

  private func sessionCallback(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) -> (SessionInfo?, Error?) -> Void {
    { info, error in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if let info {
        resolve(self.mapSession(info))
      } else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "sessionInfo"))
      }
    }
  }

  private func mapSession(_ info: SessionInfo) -> [String: Any] {
    [
      "userId": info.userId as Any,
      "sessionStartAt": info.sessionStartAt.timeIntervalSince1970,
      "sessionEndAt": info.sessionEndAt.timeIntervalSince1970
    ]
  }

  private func tokenCallback(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) -> (CertTokenInfo?, Error?) -> Void {
    { info, error in
      if let error {
        RNCKakaoUtil.reject(reject, error)
      } else if let info {
        resolve([transactionIdKey: info.txId, "token": self.mapToken(info.token)])
      } else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.responseNotFound(name: "certTokenInfo"))
      }
    }
  }

  private func mapToken(_ token: OAuthToken) -> [String: Any] {
    var result: [String: Any] = [
      "accessToken": token.accessToken,
      "refreshToken": token.refreshToken,
      "tokenType": token.tokenType,
      "accessTokenExpiresAt": token.expiredAt.timeIntervalSince1970,
      "refreshTokenExpiresAt": token.refreshTokenExpiredAt.timeIntervalSince1970,
      "accessTokenExpiresIn": token.expiresIn,
      "refreshTokenExpiresIn": token.refreshTokenExpiresIn,
      "scopes": token.scopes ?? []
    ]
    if let idToken = token.idToken {
      result["idToken"] = idToken
    }
    return result
  }
}
