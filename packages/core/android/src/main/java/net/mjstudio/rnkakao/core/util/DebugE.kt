package net.mjstudio.rnkakao.core.util

import android.util.Log
import net.mjstudio.rnkakao.core.BuildConfig

private fun debugE(message: Any?) {
  if (BuildConfig.DEBUG) Log.e("RNCKakao", "⭐️" + message.toString())
}

fun debugE(vararg message: Any?) {
  var str = ""
  for (i in message) {
    str += i.toString() + ", "
  }
  debugE(str)
}
