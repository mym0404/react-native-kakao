package net.mjstudio.rnkakao.user

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.kakao.sdk.user.UserApiClient
import net.mjstudio.rnkakao.share.KakaoUserSpec

class RNCKakaoUserModule internal constructor(context: ReactApplicationContext) :
    KakaoUserSpec(context) {

    override fun getName(): String {
        return NAME
    }

    override fun loginWithKakaoTalk(promise: Promise) {
        UserApiClient.instance.loginWithKakaoTalk(reactApplicationContext) { token, error ->
            
        }
    }

    companion object {
        const val NAME = "RNCKakaoUser"
    }
}
