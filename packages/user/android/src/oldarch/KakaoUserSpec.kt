package net.mjstudio.rnkakao.user

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReadableArray

abstract class KakaoUserSpec internal constructor(
  context: ReactApplicationContext,
) : ReactContextBaseJavaModule(context) {
  abstract fun login(
    serviceTerms: ReadableArray?,
    prompts: ReadableArray?,
    useKakaoAccountLogin: Boolean,
    scopes: ReadableArray?,
    nonce: String?,
    promise: Promise,
  )

  abstract fun isKakaoTalkLoginAvailable(promise: Promise)

  abstract fun logout(promise: Promise)

  abstract fun unlink(promise: Promise)

  abstract fun isLogined(promise: Promise)

  abstract fun scopes(
    scopes: ReadableArray?,
    promise: Promise,
  )

  abstract fun revokeScopes(
    scopes: ReadableArray,
    promise: Promise,
  )

  abstract fun serviceTerms(promise: Promise)

  abstract fun shippingAddresses(promise: Promise)

  abstract fun me(promise: Promise)

  abstract fun getAccessToken(promise: Promise)
}
