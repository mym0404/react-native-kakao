package net.mjstudio.rnkakao.user

import com.facebook.react.bridge.ReactApplicationContext
import net.mjstudio.rnkakao.user.NativeKakaoUserSpec

abstract class KakaoUserSpec internal constructor(context: ReactApplicationContext) :
    NativeKakaoUserSpec(context)
