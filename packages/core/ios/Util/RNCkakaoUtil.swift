import KakaoSDKCommon
import React
import UIKit

private let DEFAULT_APP_DISPLAY_NAME = "RNKakao"

public class RNCKakaoUtil {
  static let RNCKakaoErrorDomain = "RNCKakaoErrorDomain"

  public class func reject(
    _ reject: RCTPromiseRejectBlock,
    _ exception: NSException
  ) {
    var userInfo = [String: Any]()

    userInfo["fatal"] = true
    userInfo["code"] = "unknown"
    userInfo["message"] = exception.reason
    userInfo["nativeErrorCode"] = exception.name.rawValue
    userInfo["nativeErrorMessage"] = exception.reason

    let error = NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
    reject(exception.name.rawValue, exception.reason, error)
  }

  public class func reject(_ reject: RCTPromiseRejectBlock, _ error: Error) {
    var userInfo = [String: Any]()
    userInfo["fatal"] = false
    userInfo["code"] = "unknown"
    userInfo["message"] = error.localizedDescription
    userInfo["nativeErrorCode"] = -1
    userInfo["nativeErrorMessage"] = error.localizedDescription

    if let kakaoError = error as? SdkError {
      userInfo["isApiFailed"] = kakaoError.isApiFailed
      userInfo["isAuthFailed"] = kakaoError.isAuthFailed
      userInfo["isClientFailed"] = kakaoError.isClientFailed
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
          String(reason.rawValue),
          errorInfo?.msg ?? kakaoError.localizedDescription,
          NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
        )
      case let .AuthFailed(reason, errorInfo):
        reject(
          reason.rawValue,
          errorInfo?.errorDescription ?? kakaoError.localizedDescription,
          NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
        )
      case let .AppsFailed(reason, errorInfo):
        reject(
          reason.rawValue,
          errorInfo?.errorMsg ?? kakaoError.localizedDescription,
          NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
        )
      }
    } else {
      reject(
        "unknown",
        error.localizedDescription,
        NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
      )
    }
  }

  public class func reject(_ reject: RCTPromiseRejectBlock, _ message: String) {
    let error = NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: ["message": message])
    reject(DEFAULT_APP_DISPLAY_NAME, message, error)
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
