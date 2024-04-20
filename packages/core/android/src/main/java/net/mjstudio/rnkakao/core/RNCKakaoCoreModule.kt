package net.mjstudio.rnkakao.core

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.kakao.sdk.common.KakaoSdk

class RNCKakaoCoreModule internal constructor(context: ReactApplicationContext) :
    KakaoCoreSpec(context) {

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    override fun initializeKakaoSDK(appKey: String) {
        KakaoSdk.init(context = reactApplicationContext, appKey = appKey)
    }

    companion object {
        const val NAME = "RNCKakaoCore"
    }
}
