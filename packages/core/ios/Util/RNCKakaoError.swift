import Foundation

public enum RNCKakaoError: Error, CustomStringConvertible {
  case unknown(_ message: String? = nil)
  case responseNotFound(name: String)
  case sdkNotInitialized

  public var code: String {
    switch self {
    case .unknown: "Package-Unknown"
    case .responseNotFound: "Package-APIResponseNotFound"
    case .sdkNotInitialized: "Package-SDKNotInitialized"
    }
  }

  public var description: String {
    switch self {
    case let .unknown(message): "Unknown error from package. This can be a bug of react-native-kakao package. message: \(message ?? "None")"
    case let .responseNotFound(name): "The API response from Kakao Native SDK missing. name: \(name)"
    case .sdkNotInitialized: "The SDK is not initialized from react-native-kakao"
    }
  }
}
