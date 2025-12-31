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
import com.kakao.sdk.common.model.KakaoSdkError
import java.util.Date

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
      putBoolean("isPackageError", false)
    }

  when (e) {
    is KakaoSdkError -> {
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
      }
    }

    is RNCKakaoException -> {
      userInfo.putBoolean("isPackageError", true)
      reject(e.code, e.message, userInfo)
    }

    else -> {
      userInfo.putBoolean("isPackageError", true)
      reject(
        RNCKakaoUnknownException().code,
        message,
        userInfo,
      )
    }
  }
}

inline fun <reified T> ReadableArray.filterIsInstance(): List<T> = toArrayList().filterIsInstance<T>()

fun ReadableArray.filterIsReadableMap(): List<ReadableMap> {
  val ret = mutableListOf<ReadableMap>()
  for (i in 0 until this.size()) {
    if (getType(i) == ReadableType.Map) {
      getMap(i)?.let { ret.add(it) }
    }
  }
  return ret
}

fun WritableArray.pushStringList(list: List<String>): WritableArray {
  list.forEach(::pushString)
  return this
}

fun WritableArray.pushIntList(list: List<Int>): WritableArray {
  list.forEach(::pushInt)
  return this
}

fun WritableArray.pushDoubleList(list: List<Double>): WritableArray {
  list.forEach(::pushDouble)
  return this
}

fun WritableArray.pushMapList(list: List<WritableMap>): WritableArray {
  list.forEach(::pushMap)
  return this
}

fun WritableMap.putB(
  key: String,
  value: Boolean?,
): WritableMap {
  if (value != null) {
    putBoolean(key, value)
  } else {
    putNull(key)
  }
  return this
}

fun WritableMap.putI(
  key: String,
  value: Int?,
): WritableMap {
  if (value != null) {
    putInt(key, value)
  } else {
    putNull(key)
  }
  return this
}

fun WritableMap.putD(
  key: String,
  value: Double?,
): WritableMap {
  if (value != null) {
    putDouble(key, value)
  } else {
    putNull(key)
  }
  return this
}

fun WritableMap.putL(
  key: String,
  value: Long?,
): WritableMap = putD(key, value?.toDouble())

fun WritableMap.putS(
  key: String,
  value: String?,
): WritableMap {
  putString(key, value)
  return this
}

fun argMap(): WritableMap = Arguments.createMap()

fun argArr(): WritableArray = Arguments.createArray()

fun ReadableMap.toStringMap(): Map<String, String> = toHashMap().filterValues { it is String }.mapValues { it.value.toString() }

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
  ): Long = (d1.time - d2.time) / 1000L
}

val Date.unix: Long
  get() = time / 1000
