import KakaoSDKCommon
import React
import UIKit

private let DEFAULT_APP_DISPLAY_NAME = "RNKakao"

public class RNCKakaoUtil {
  static let RNCKakaoErrorDomain = "RNCKakaoErrorDomain"

  public class func reject(_ reject: RCTPromiseRejectBlock, _ error: Error) {
    var userInfo = [String: Any]()

    let message = error.localizedDescription

    userInfo["fatal"] = false
    userInfo["nativeErrorMessage"] = message
    userInfo["isApiFailed"] = false
    userInfo["isAuthFailed"] = false
    userInfo["isClientFailed"] = false
    userInfo["isAppsFailed"] = false
    userInfo["isInvalidTokenError"] = false
    userInfo["isPackageError"] = false

    if let kakaoError = error as? SdkError {
      userInfo["isApiFailed"] = kakaoError.isApiFailed
      userInfo["isAuthFailed"] = kakaoError.isAuthFailed
      userInfo["isClientFailed"] = kakaoError.isClientFailed
      userInfo["isAppsFailed"] = kakaoError.isAppsFailed
      userInfo["isInvalidTokenError"] = kakaoError.isInvalidTokenError()

      switch kakaoError {
      case let .ClientFailed(reason, errorMessage):
        reject(
          "\(reason)",
          errorMessage,
          NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
        )
      case let .ApiFailed(reason, errorInfo):
        if let requiredScopes = errorInfo?.requiredScopes {
          userInfo["requiredScopes"] = requiredScopes
        }
        reject(
          "\(reason)",
          errorInfo?.msg ?? message,
          NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
        )
      case let .AuthFailed(reason, errorInfo):
        reject(
          "\(reason)",
          errorInfo?.errorDescription ?? message,
          NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
        )
      case let .AppsFailed(reason, errorInfo):
        reject(
          "\(reason)",
          errorInfo?.errorMsg ?? message,
          NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
        )
      }
    } else if let packageError = error as? RNCKakaoError {
      userInfo["isPackageError"] = true
      reject(
        packageError.code,
        packageError.description,
        NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
      )
    } else {
      userInfo["isPackageError"] = true
      reject(
        RNCKakaoError.unknown().code,
        message,
        NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
      )
    }
  }

  private class func getTopmostViewController(
    base: UIViewController? = UIApplication.shared.windows
      .first(where: { $0.isKeyWindow })?.rootViewController
  ) -> UIViewController? {
    if let nav = base as? UINavigationController {
      return getTopmostViewController(base: nav.visibleViewController)
    }
    if let tab = base as? UITabBarController, let selected = tab.selectedViewController {
      return getTopmostViewController(base: selected)
    }
    if let presented = base?.presentedViewController {
      return getTopmostViewController(base: presented)
    }
    return base
  }

  public class func presentViewController(
    _ viewController: UIViewController,
    completion: ((Bool) -> Void)?
  ) {
    if let topmostViewController = getTopmostViewController() {
      topmostViewController.present(viewController, animated: true) {
        completion?(true)
      }
    } else {
      completion?(false)
    }
  }
}

public func onMain(fn: @escaping () -> Void) {
  if Thread.isMainThread {
    fn()
  } else {
    DispatchQueue.main.async {
      fn()
    }
  }
}
