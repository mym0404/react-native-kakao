package net.mjstudio.rnkakao.user

import com.facebook.react.bridge.ReactApplicationContext
import net.mjstudio.rnkakao.share.KakaoUserSpec

class RNCKakaoUserModule internal constructor(context: ReactApplicationContext) :
    KakaoUserSpec(context) {

    override fun getName(): String {
        return NAME
    }

    companion object {
        const val NAME = "RNCKakaoUser"
    }
}
