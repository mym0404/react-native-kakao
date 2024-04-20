package net.mjstudio.rnkakao.core

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.Promise

abstract class KakaoCoreSpec internal constructor(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

    @ReactMethod
    abstract fun initializeKakaoSDK(appKey: String)
}
