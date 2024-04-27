package net.mjstudio.rnkakao.core.util

import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.kakao.sdk.common.model.ApiError
import com.kakao.sdk.common.model.AppsError
import com.kakao.sdk.common.model.AuthError
import com.kakao.sdk.common.model.ClientError
import java.util.Date

private const val UNKNOWN_ERROR = "RNC_KAKAO_UNKNOWN"

fun Promise.rejectWith(e: Throwable) {
  val message = e.localizedMessage ?: ""

  val userInfo =
    argMap().apply {
      putBoolean("fatal", true)
      putString("nativeErrorMessage", message)
      putBoolean("isApiFailed", false)
      putBoolean("isAuthFailed", false)
      putBoolean("isClientFailed", false)
      putBoolean("isAppsFailed", false)
      putBoolean("isInvalidTokenError", false)
    }

  when (e) {
    is ClientError -> {
      userInfo.putBoolean("isClientFailed", true)
      userInfo.putBoolean("isInvalidTokenError", e.isInvalidTokenError())
      reject(e.reason.name, e.msg, userInfo)
    }
    is ApiError -> {
      userInfo.putBoolean("isApiFailed", true)
      userInfo.putBoolean("isInvalidTokenError", e.isInvalidTokenError())
      reject(e.reason.name, e.msg, userInfo)
    }
    is AuthError -> {
      userInfo.putBoolean("isAuthFailed", true)
      userInfo.putBoolean("isInvalidTokenError", e.isInvalidTokenError())
      reject(e.reason.name, e.msg, userInfo)
    }
    is AppsError -> {
      userInfo.putBoolean("isAppsFailed", true)
      userInfo.putBoolean("isInvalidTokenError", e.isInvalidTokenError())
      reject(e.reason.name, e.msg, userInfo)
    }
    else -> {
      reject(
        UNKNOWN_ERROR,
        message,
        userInfo,
      )
    }
  }
}

fun Promise.rejectWith(s: String) {
  rejectWith(RuntimeException(s))
}

inline fun <reified T> ReadableArray.filterIsInstance(): List<T> {
  return toArrayList().filterIsInstance<T>()
}

fun ReadableArray.filterIsReadableMap(): List<ReadableMap> {
  val ret = mutableListOf<ReadableMap>()
  for (i in 0 until this.size()) {
    if (getType(i) == ReadableType.Map) {
      ret.add(getMap(i))
    }
  }
  return ret
}

fun WritableArray.pushStringList(list: List<String>) = list.forEach(::pushString)

fun WritableArray.pushIntList(list: List<Int>) = list.forEach(::pushInt)

fun WritableArray.pushDoubleList(list: List<Double>) = list.forEach(::pushDouble)

fun WritableArray.pushMapList(list: List<WritableMap>): WritableArray {
  list.forEach(::pushMap)
  return this
}

fun WritableMap.putBooleanIfNotNull(
  key: String,
  value: Boolean?,
) {
  if (value != null) {
    putBoolean(key, value)
  }
}

fun WritableMap.putIntIfNotNull(
  key: String,
  value: Int?,
) {
  if (value != null) {
    putInt(key, value)
  }
}

fun WritableMap.putDoubleIfNotNull(
  key: String,
  value: Double?,
) {
  if (value != null) {
    putDouble(key, value)
  }
}

fun argMap(): WritableMap {
  return Arguments.createMap()
}

fun argArr(): WritableArray {
  return Arguments.createArray()
}

fun ReadableMap.toStringMap(): Map<String, String> {
  return toHashMap().filterValues { it is String }.mapValues { it.value.toString() }
}

fun ReadableMap.getIntElseNull(key: String): Int? {
  if (hasKey(key)) return getInt(key)
  return null
}

fun ReadableMap.getDoubleElseNull(key: String): Double? {
  if (hasKey(key)) return getDouble(key)
  return null
}

fun ReadableMap.getBooleanElseNull(key: String): Boolean? {
  if (hasKey(key)) return getBoolean(key)
  return null
}

fun onMain(fn: () -> Unit) {
  if (Looper.myLooper() == Looper.getMainLooper()) {
    fn()
  } else {
    UiThreadUtil.runOnUiThread {
      fn()
    }
  }
}

object RNCKakaoUtil {
  fun diffSec(
    d1: Date,
    d2: Date,
  ): Long {
    return (d1.time - d2.time) / 1000L
  }
}
