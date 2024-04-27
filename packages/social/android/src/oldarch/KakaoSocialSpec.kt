package net.mjstudio.rnkakao.social

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReadableMap

abstract class KakaoSocialSpec internal constructor(context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {
    abstract fun getProfile(promise: Promise)

    abstract fun selectFriends(
      multiple: Boolean,
      mode: String?,
      options: ReadableMap?,
      promise: Promise,
    )
  }
