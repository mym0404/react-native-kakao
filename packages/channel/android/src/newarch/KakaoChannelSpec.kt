package net.mjstudio.rnkakao.channel

import com.facebook.react.bridge.ReactApplicationContext

abstract class KakaoChannelSpec internal constructor(
  context: ReactApplicationContext,
) : NativeKakaoChannelSpec(context)
