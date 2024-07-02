package net.mjstudio.rnkakao.map

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

abstract class KakaoMapSpec internal constructor(
  context: ReactApplicationContext,
) : ReactContextBaseJavaModule(context) {
  abstract fun initializeKakaoMapSDK(
    appKey: String,
    promise: Promise,
  )
}
