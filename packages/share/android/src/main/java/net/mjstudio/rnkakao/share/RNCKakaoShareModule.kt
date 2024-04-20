package net.mjstudio.rnkakao.share

import com.facebook.react.bridge.ReactApplicationContext

class RNCKakaoShareModule internal constructor(context: ReactApplicationContext) :
  KakaoShareSpec(context) {

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "RNCKakaoShare"
  }
}
