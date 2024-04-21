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
      let newErrorWithUserInfo = NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
      reject(
        kakaoError.asAFError?.failureReason ?? "unknown",
        kakaoError.localizedDescription,
        newErrorWithUserInfo
      )
    } else {
      let newErrorWithUserInfo = NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: userInfo)
      reject("unknown", error.localizedDescription, newErrorWithUserInfo)
    }
  }

  public class func reject(_ reject: RCTPromiseRejectBlock, _ message: String) {
    let error = NSError(domain: RNCKakaoErrorDomain, code: 444, userInfo: ["message": message])

    reject(DEFAULT_APP_DISPLAY_NAME, message, error)
  }

  private class func getViewController(
    base: UIViewController? = UIApplication.shared.windows
      .first(where: { $0.isKeyWindow })?.rootViewController
  ) -> UIViewController? {
    if let nav = base as? UINavigationController {
      return getViewController(base: nav.visibleViewController)
    }
    if let tab = base as? UITabBarController, let selected = tab.selectedViewController {
      return getViewController(base: selected)
    }
    if let presented = base?.presentedViewController {
      return getViewController(base: presented)
    }
    return base
  }

  public class func presentViewController(
    _ viewController: UIViewController,
    completion: (() -> Void)?
  ) {
    getViewController()?.present(viewController, animated: true, completion: completion)
  }
}
