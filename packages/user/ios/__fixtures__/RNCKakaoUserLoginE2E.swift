#if RNKAKAO_E2E
  import Foundation
  import KakaoSDKAuth
  import KakaoSDKCommon

  enum RNCKakaoUserLoginE2E {
    private static let exampleBundleIdentifier = "com.rnkakao.example"

    private enum Scenario: String {
      case talkErrorAccountSuccess = "rnkakao-e2e:talk-error-account-success"
      case talkCancel = "rnkakao-e2e:talk-cancel"
      case talkConsentCancel = "rnkakao-e2e:talk-consent-cancel"
      case talkErrorAccountError = "rnkakao-e2e:talk-error-account-error"
      case directAccount = "rnkakao-e2e:direct-account"
      case talkSuccess = "rnkakao-e2e:talk-success"
    }

    static func isEnabled(nonce: String?) -> Bool {
      scenario(nonce: nonce) != nil
    }

    static func loginWithKakaoTalk(
      serviceTerms: [String]?,
      nonce: String?,
      completion: @escaping (OAuthToken?, Error?) -> Void
    ) -> Bool {
      guard let scenario = scenario(nonce: nonce) else { return false }

      switch scenario {
      case .talkErrorAccountSuccess,
           .talkErrorAccountError:
        completion(nil, error("E2E_TALK_FAILED"))
      case .talkCancel:
        completion(
          nil,
          SdkError.ClientFailed(reason: .Cancelled, errorMessage: "E2E_TALK_CANCELLED")
        )
      case .talkConsentCancel:
        completion(nil, SdkError.AuthFailed(reason: .AccessDenied, errorInfo: nil))
      case .talkSuccess:
        guard serviceTerms == ["e2e-term"] else {
          completion(nil, error("E2E_INVALID_TALK_INPUT"))
          return true
        }
        completion(token(accessToken: "e2e-talk", nonce: nonce), nil)
      case .directAccount:
        completion(nil, error("E2E_UNEXPECTED_TALK"))
      }
      return true
    }

    static func loginWithKakaoAccount(
      prompts: [Prompt]?,
      serviceTerms: [String]?,
      nonce: String?,
      completion: @escaping (OAuthToken?, Error?) -> Void
    ) -> Bool {
      guard let scenario = scenario(nonce: nonce) else { return false }

      switch scenario {
      case .talkErrorAccountSuccess:
        guard prompts == nil, serviceTerms == ["e2e-term"] else {
          completion(nil, error("E2E_INVALID_ACCOUNT_INPUT"))
          return true
        }
        completion(token(accessToken: "e2e-account", nonce: nonce), nil)
      case .talkErrorAccountError:
        completion(nil, error("E2E_ACCOUNT_FAILED"))
      case .directAccount:
        guard prompts == [.Login] else {
          completion(nil, error("E2E_INVALID_ACCOUNT_INPUT"))
          return true
        }
        completion(token(accessToken: "e2e-account", nonce: nonce), nil)
      case .talkCancel,
           .talkConsentCancel,
           .talkSuccess:
        completion(nil, error("E2E_UNEXPECTED_ACCOUNT"))
      }
      return true
    }

    private static func scenario(nonce: String?) -> Scenario? {
      guard Bundle.main.bundleIdentifier == exampleBundleIdentifier else { return nil }
      return Scenario(rawValue: nonce ?? "")
    }

    private static func token(accessToken: String, nonce: String?) -> OAuthToken {
      OAuthToken(
        accessToken: accessToken,
        tokenType: "Bearer",
        refreshToken: "e2e-refresh",
        scope: nil,
        scopes: [],
        idToken: nonce
      )
    }

    private static func error(_ message: String) -> SdkError {
      SdkError.ClientFailed(reason: .Unknown, errorMessage: message)
    }
  }
#endif
