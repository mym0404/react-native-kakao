package net.mjstudio.rnkakao.channel

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

abstract class KakaoChannelSpec internal constructor(context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {
    abstract fun followChannel(
      channelPublicId: String,
      promise: Promise,
    )

    abstract fun addChannel(
      channelPublicId: String,
      promise: Promise,
    )

    abstract fun getAddChannelUrl(
      channelPublicId: String,
      promise: Promise,
    )

    abstract fun openAddChannelUrl(
      channelPublicId: String,
      promise: Promise,
    )

    abstract fun chatChannel(
      channelPublicId: String,
      promise: Promise,
    )

    abstract fun getChatChannelUrl(
      channelPublicId: String,
      promise: Promise,
    )

    abstract fun openChatChannelUrl(
      channelPublicId: String,
      promise: Promise,
    )

    abstract fun channels(promise: Promise)
  }
