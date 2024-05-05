package net.mjstudio.rnkakao.map

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.kakao.vectormap.KakaoMapSdk

class RNCKakaoMapModule internal constructor(context: ReactApplicationContext) :
  KakaoMapSpec(context) {
    override fun getName(): String {
      return NAME
    }

    override fun initializeKakaoMapSDK(
      appKey: String,
      promise: Promise,
    ) {
      KakaoMapSdk.init(reactApplicationContext, appKey)
      promise.resolve(42)
    }

    companion object {
      const val NAME = "RNCKakaoMap"
    }
  }
