package net.mjstudio.rnkakao.share

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReadableMap

abstract class KakaoShareSpec internal constructor(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
    abstract fun shareCustom(
        templateId: Int,
        useWebBrowserIfKakaoTalkNotAvailable: Boolean,
        templateArgs: ReadableMap?,
        serverCallbackArgs: ReadableMap?,
        promise: Promise,
    )
}
