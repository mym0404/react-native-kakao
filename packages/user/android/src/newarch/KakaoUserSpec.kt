package net.mjstudio.rnkakao.share

import com.facebook.react.bridge.ReactApplicationContext
import net.mjstudio.rnkakao.user.NativeKakaoUserSpec

abstract class KakaoUserSpec internal constructor(context: ReactApplicationContext) :
    NativeKakaoUserSpec(context)
