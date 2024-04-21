package net.mjstudio.rnkakao.core.util

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.kakao.sdk.common.model.ApiError

private const val NAME = "RNCKakao"

fun Promise.rejectWith(e: Throwable) {
    val map = Arguments.createMap().apply {

    }
    if (e is Exception) {
        reject(NAME, e.localizedMessage ?: "unknown error", getExceptionMap(e))
    } else {

    }
}

private fun getExceptionMap(exception: Exception): WritableMap {
    val exceptionMap = Arguments.createMap()
    if (exception is ApiError) {
        val code = exception.statusCode
        val message = exception.localizedMessage ?: "unknown error"
        val reason = exception.reason.errorCode

        return Arguments.createMap().apply {
            putInt()
        }
    } else {
        val code = "unknown"
        val message = exception.localizedMessage ?: "unknown error"
        exceptionMap.putString("code", code)
        exceptionMap.putString("nativeErrorCode", code)
        exceptionMap.putString("message", message)
        exceptionMap.putString("nativeErrorMessage", message)
        return exceptionMap
    }
}