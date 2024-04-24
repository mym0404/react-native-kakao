package net.mjstudio.rnkakao.navi

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

abstract class KakaoNaviSpec internal constructor(context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {
    abstract fun navigateOrShareTo(
      destination: ReadableMap,
      option: ReadableMap?,
      viaList: ReadableArray?,
      openWebInstallUrlIfNaviAppNotAvailable: Boolean?,
      isShare: Boolean?,
      promise: Promise,
    )
  }
