package net.mjstudio.rnkakao.channel

import com.facebook.react.bridge.ReactApplicationContext

class RNCKakaoChannelModule internal constructor(context: ReactApplicationContext) :
  KakaoChannelSpec(context) {
    override fun getName(): String {
      return NAME
    }

    companion object {
      const val NAME = "RNCKakaoChannel"
    }
  }
