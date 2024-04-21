/// Copyright (c) 2016-present Invertase Limited & Contributors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this library except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import KakaoSDKCommon
import React

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
}
