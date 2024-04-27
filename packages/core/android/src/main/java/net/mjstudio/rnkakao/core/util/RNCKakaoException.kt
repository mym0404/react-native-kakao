package net.mjstudio.rnkakao.core.util

sealed class RNCKakaoException(message: String) : Exception(message) {
  abstract val code: String
}

class RNCKakaoUnknownException(message: String? = null) : RNCKakaoException(
  "Unknown error from package. This can be a bug of react-native-kakao package. message: ${message ?: "None"}",
) {
  override val code: String = "Package-Unknown"
}

class RNCKakaoResponseNotFoundException(name: String) : RNCKakaoException("The API response from Kakao Native SDK missing. name: $name") {
  override val code: String = "Package-APIResponseNotFound"
}

class RNCKakaoSdkNotInitializedException : RNCKakaoException("The SDK is not initialized from react-native-kakao") {
  override val code: String = "Package-SDKNotInitialized"
}
