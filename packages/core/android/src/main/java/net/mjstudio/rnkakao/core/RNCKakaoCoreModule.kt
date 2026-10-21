package net.mjstudio.rnkakao.core

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.kakao.sdk.common.KakaoSdk
import com.kakao.sdk.common.model.SdkIdentifier
import com.kakao.sdk.common.util.Utility
import net.mjstudio.rnkakao.core.util.argMap
import net.mjstudio.rnkakao.core.util.onMain
import net.mjstudio.rnkakao.core.util.rejectWith
import com.kakao.sdk.v2.common.BuildConfig as KakaoBuildConfig

class RNCKakaoCoreModule internal constructor(
  context: ReactApplicationContext,
) : NativeKakaoCoreSpec(context) {
  @ReactMethod
  override fun initializeKakaoSDK(
    appKey: String,
    loggingEnabled: Boolean,
    customScheme: String?,
    androidSdkIdentifier: String?,
    promise: Promise,
  ) = onMain {
    try {
      KakaoSdk.init(
        context = reactApplicationContext,
        appKey = appKey,
        customScheme = customScheme,
        loggingEnabled = loggingEnabled,
        sdkIdentifier = androidSdkIdentifier?.let { SdkIdentifier(it) },
      )
      promise.resolve(null)
    } catch (error: Exception) {
      promise.rejectWith(error)
    }
  }

  @ReactMethod
  override fun getKakaoSDKInfo(promise: Promise) =
    onMain {
      promise.resolve(
        argMap().apply {
          putString("version", KakaoBuildConfig.VERSION_NAME)
          putBoolean("isInitialized", KakaoSdk.isInitialized)
          putBoolean("loggingEnabled", KakaoSdk.loggingEnabled)
          if (KakaoSdk.isInitialized) {
            putString("appKey", KakaoSdk.appKey)
            putString("kaHeader", KakaoSdk.kaHeader)
            putString("redirectUri", KakaoSdk.redirectUri)
          }
        },
      )
    }

  @ReactMethod
  override fun getKeyHashAndroid(promise: Promise) {
    promise.resolve(Utility.getKeyHash(reactApplicationContext))
  }
}
