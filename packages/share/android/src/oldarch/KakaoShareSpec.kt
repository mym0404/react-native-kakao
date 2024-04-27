package net.mjstudio.rnkakao.share

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

abstract class KakaoShareSpec internal constructor(context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {
    abstract fun shareOrSendMeOrSendFriendOrWhatever(
      sendType: String,
      templateType: String,
      templateId: Double,
      templateJson: ReadableMap,
      receiverUuids: ReadableArray,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      templateArgs: ReadableMap,
      serverCallbackArgs: ReadableMap,
      promise: Promise,
    )
  }
