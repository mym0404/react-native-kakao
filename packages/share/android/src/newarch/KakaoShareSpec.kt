package net.mjstudio.rnkakao.share

import com.facebook.react.bridge.ReactApplicationContext

abstract class KakaoShareSpec internal constructor(
  context: ReactApplicationContext,
) : NativeKakaoShareSpec(context)
