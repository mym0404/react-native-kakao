package net.mjstudio.rnkakao.core.util

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.kakao.sdk.common.model.ApiError
import java.util.*

fun Promise.rejectWith(e: Throwable) {
    val message = e.localizedMessage ?: "unknown"
    if (e is ApiError) {
        val code = e.reason.errorCode
        val statusCode = e.statusCode

        reject(code.toString(), message, Arguments.createMap().apply {
            putInt("code", code)
            putInt("statusCode", statusCode)
            putString("message", message)
            putInt("nativeErrorCode", code)
            putString("nativeErrorMessage", message)
            putBoolean("isInvalidTokenError", e.isInvalidTokenError())
        })
    } else {
        reject("unknown", message, Arguments.createMap().apply {
            putInt("code", -1)
            putString("message", message)
            putInt("nativeErrorCode", -1)
            putString("nativeErrorMessage", message)
        })
    }
}

fun Promise.rejectWith(s: String) {
    reject("unknown", s, Arguments.createMap().apply {
        putInt("code", -1)
        putString("message", s)
        putInt("nativeErrorCode", -1)
        putString("nativeErrorMessage", s)
    })
}

inline fun <reified T> ReadableArray.filterIsInstance(): List<T>? {
    return toArrayList()?.filterIsInstance<T>()
}

fun WritableArray.pushStringList(list: List<String>) = list.forEach(::pushString)
fun WritableArray.pushIntList(list: List<Int>) = list.forEach(::pushInt)
fun WritableArray.pushDoubleList(list: List<Double>) = list.forEach(::pushDouble)
fun WritableArray.pushMapList(list: List<WritableMap>) = list.forEach(::pushMap)

fun WritableMap.putBooleanIfNotNull(key: String, value: Boolean?) {
    if (value != null) {
        putBoolean(key, value)
    }
}

fun WritableMap.putIntIfNotNull(key: String, value: Int?) {
    if (value != null) {
        putInt(key, value)
    }
}

fun WritableMap.putDoubleIfNotNull(key: String, value: Double?) {
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

object RNCKakaoUtil {
    fun diffSec(d1: Date, d2: Date): Long {
        return (d1.time - d2.time) / 1000L
    }
}