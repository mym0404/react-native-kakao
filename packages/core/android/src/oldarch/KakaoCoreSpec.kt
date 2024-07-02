package net.mjstudio.rnkakao.core

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

abstract class KakaoCoreSpec internal constructor(
  context: ReactApplicationContext,
) : ReactContextBaseJavaModule(context) {
  abstract fun initializeKakaoSDK(appKey: String)

  abstract fun getKeyHashAndroid(promise: Promise)
}
