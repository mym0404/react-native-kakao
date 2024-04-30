package net.mjstudio.rnkakao.channel

import android.content.ActivityNotFoundException
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.kakao.sdk.common.util.KakaoCustomTabsClient
import com.kakao.sdk.talk.TalkApiClient
import net.mjstudio.rnkakao.core.util.RNCKakaoResponseNotFoundException
import net.mjstudio.rnkakao.core.util.argArr
import net.mjstudio.rnkakao.core.util.argMap
import net.mjstudio.rnkakao.core.util.filterIsInstance
import net.mjstudio.rnkakao.core.util.onMain
import net.mjstudio.rnkakao.core.util.pushMapList
import net.mjstudio.rnkakao.core.util.putL
import net.mjstudio.rnkakao.core.util.putS
import net.mjstudio.rnkakao.core.util.rejectWith
import net.mjstudio.rnkakao.core.util.unix

class RNCKakaoChannelModule internal constructor(context: ReactApplicationContext) :
  KakaoChannelSpec(context) {
    override fun getName(): String {
      return NAME
    }

    @ReactMethod
    override fun followChannel(
      channelPublicId: String,
      promise: Promise,
    ) = onMain {
      val context =
        currentActivity ?: run {
          promise.rejectWith(ActivityNotFoundException())
          return@onMain
        }

      TalkApiClient.instance.followChannel(context, channelPublicId) { followChannelResult, error ->
        if (error != null) {
          promise.rejectWith(error)
        } else if (followChannelResult == null) {
          promise.rejectWith(RNCKakaoResponseNotFoundException("followChannelResult"))
        } else {
          promise.resolve(followChannelResult.success)
        }
      }
    }

    @ReactMethod
    override fun addChannel(
      channelPublicId: String,
      promise: Promise,
    ) = onMain {
      val context =
        currentActivity ?: run {
          promise.rejectWith(ActivityNotFoundException())
          return@onMain
        }

      TalkApiClient.instance.addChannel(context, channelPublicId) { error ->
        if (error != null) {
          promise.rejectWith(error)
        } else {
          promise.resolve(42)
        }
      }
    }

    @ReactMethod
    override fun getAddChannelUrl(
      channelPublicId: String,
      promise: Promise,
    ) = onMain {
      runCatching {
        val url = TalkApiClient.instance.addChannelUrl(channelPublicId)
        promise.resolve(url.toString())
      }.onFailure {
        promise.rejectWith(it)
      }
    }

    @ReactMethod
    override fun openAddChannelUrl(
      channelPublicId: String,
      promise: Promise,
    ) = onMain {
      val context =
        currentActivity ?: run {
          promise.rejectWith(ActivityNotFoundException())
          return@onMain
        }
      runCatching {
        val url = TalkApiClient.instance.addChannelUrl(channelPublicId)
        KakaoCustomTabsClient.openWithDefault(context, url)
        promise.resolve(url.toString())
      }.onFailure {
        promise.rejectWith(it)
      }
    }

    @ReactMethod
    override fun chatChannel(
      channelPublicId: String,
      promise: Promise,
    ) = onMain {
      val context =
        currentActivity ?: run {
          promise.rejectWith(ActivityNotFoundException())
          return@onMain
        }

      TalkApiClient.instance.chatChannel(context, channelPublicId) { error ->
        if (error != null) {
          promise.rejectWith(error)
        } else {
          promise.resolve(42)
        }
      }
    }

    @ReactMethod
    override fun getChatChannelUrl(
      channelPublicId: String,
      promise: Promise,
    ) = onMain {
      runCatching {
        val url = TalkApiClient.instance.chatChannelUrl(channelPublicId)
        promise.resolve(url.toString())
      }.onFailure {
        promise.rejectWith(it)
      }
    }

    @ReactMethod
    override fun openChatChannelUrl(
      channelPublicId: String,
      promise: Promise,
    ) = onMain {
      val context =
        currentActivity ?: run {
          promise.rejectWith(ActivityNotFoundException())
          return@onMain
        }
      runCatching {
        val url = TalkApiClient.instance.chatChannelUrl(channelPublicId)
        KakaoCustomTabsClient.openWithDefault(context, url)
        promise.resolve(url.toString())
      }.onFailure {
        promise.rejectWith(it)
      }
    }

    @ReactMethod
    override fun channels(
      channelPublicIds: ReadableArray?,
      promise: Promise,
    ) = onMain {
      TalkApiClient.instance.channels(publicIds = channelPublicIds?.filterIsInstance<String>()) { relations, error ->
        if (error != null) {
          promise.rejectWith(error)
        } else if (relations?.channels == null) {
          promise.rejectWith(RNCKakaoResponseNotFoundException("channels"))
        } else {
          promise.resolve(
            argArr().pushMapList(
              relations.channels!!.map {
                argMap().apply {
                  putS("uuid", it.uuid)
                  putS("encodedId", it.encodedId)
                  putS("relation", it.relation.name.lowercase())
                  putL("updateAt", it.updatedAt?.unix)
                }
              },
            ),
          )
        }
      }
    }

    companion object {
      const val NAME = "RNCKakaoChannel"
    }
  }
