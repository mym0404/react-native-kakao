package net.mjstudio.rnkakao.share

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReadableMap

abstract class KakaoShareSpec internal constructor(context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {
    abstract fun shareCustom(
      templateId: Double,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      templateArgs: ReadableMap?,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    )

    abstract fun shareFeedTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    )

    abstract fun shareListTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    )

    abstract fun shareLocationTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    )

    abstract fun shareCommerceTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    )

    abstract fun shareTextTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    )

    abstract fun shareCalendarTemplate(
      value: ReadableMap,
      useWebBrowserIfKakaoTalkNotAvailable: Boolean,
      serverCallbackArgs: ReadableMap?,
      promise: Promise,
    )

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
