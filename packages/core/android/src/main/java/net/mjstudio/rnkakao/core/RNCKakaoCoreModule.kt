package net.mjstudio.rnkakao.core

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.kakao.sdk.common.KakaoSdk
import com.kakao.sdk.common.util.Utility
import net.mjstudio.rnkakao.core.util.onMain

class RNCKakaoCoreModule internal constructor(
  context: ReactApplicationContext,
) : KakaoCoreSpec(context) {
  override fun getName(): String = NAME

  @ReactMethod
  override fun initializeKakaoSDK(appKey: String) =
    onMain {
      KakaoSdk.init(context = reactApplicationContext, appKey = appKey)
    }

  @ReactMethod
  override fun getKeyHashAndroid(promise: Promise) {
    promise.resolve(Utility.getKeyHash(reactApplicationContext))
  }

  companion object {
    const val NAME = "RNCKakaoCore"
  }
}
