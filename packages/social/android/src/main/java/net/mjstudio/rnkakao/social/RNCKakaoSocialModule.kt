package net.mjstudio.rnkakao.social

import android.content.ActivityNotFoundException
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.kakao.sdk.friend.client.selectFriend
import com.kakao.sdk.friend.core.PickerClient
import com.kakao.sdk.friend.core.model.OpenPickerFriendRequestParams
import com.kakao.sdk.friend.core.model.PickerOrientation
import com.kakao.sdk.friend.core.model.PickerOrientation.LANDSCAPE
import com.kakao.sdk.friend.core.model.PickerOrientation.PORTRAIT
import com.kakao.sdk.friend.core.model.SelectParams
import com.kakao.sdk.friend.core.model.SelectedUsers
import com.kakao.sdk.friend.core.model.SelectionMode.MULTIPLE
import com.kakao.sdk.friend.core.model.SelectionMode.SINGLE
import com.kakao.sdk.friend.core.model.ViewAppearance.AUTO
import com.kakao.sdk.friend.core.model.ViewAppearance.DARK
import com.kakao.sdk.friend.core.model.ViewAppearance.LIGHT
import com.kakao.sdk.friend.core.model.ViewType.FULL
import com.kakao.sdk.friend.core.model.ViewType.POPUP
import com.kakao.sdk.talk.TalkApiClient
import com.kakao.sdk.talk.model.FriendOrder
import com.kakao.sdk.talk.model.Order
import net.mjstudio.rnkakao.core.util.RNCKakaoResponseNotFoundException
import net.mjstudio.rnkakao.core.util.argArr
import net.mjstudio.rnkakao.core.util.argMap
import net.mjstudio.rnkakao.core.util.getBooleanElseNull
import net.mjstudio.rnkakao.core.util.getIntElseNull
import net.mjstudio.rnkakao.core.util.onMain
import net.mjstudio.rnkakao.core.util.pushMapList
import net.mjstudio.rnkakao.core.util.putB
import net.mjstudio.rnkakao.core.util.putD
import net.mjstudio.rnkakao.core.util.putI
import net.mjstudio.rnkakao.core.util.rejectWith

class RNCKakaoSocialModule internal constructor(
  context: ReactApplicationContext,
) : NativeKakaoSocialSpec(context) {
  @ReactMethod
  override fun getProfile(promise: Promise) =
    onMain {
      TalkApiClient.instance.profile { profile, error ->
        if (error != null) {
          promise.rejectWith(error)
          return@profile
        }
        if (profile == null) {
          promise.rejectWith(RNCKakaoResponseNotFoundException("profile"))
          return@profile
        }
        promise.resolve(
          argMap().apply {
            putString("nickname", profile.nickname)
            putString("countryISO", profile.countryISO)
            putString("profileImageUrl", profile.profileImageUrl)
            putString("thumbnailUrl", profile.thumbnailUrl)
          },
        )
      }
    }

  @ReactMethod
  override fun selectFriends(
    multiple: Boolean,
    mode: String?,
    options: ReadableMap?,
    promise: Promise,
  ) = onMain {
    val context =
      reactApplicationContext.currentActivity ?: run {
        promise.reject(ActivityNotFoundException())
        return@onMain
      }
    val callback = { users: SelectedUsers?, error: Throwable? ->
      if (error != null) {
        promise.rejectWith(error)
      } else if (users == null) {
        promise.rejectWith(RNCKakaoResponseNotFoundException("users"))
      } else {
        promise.resolve(
          argMap().apply {
            putInt("totalCount", users.totalCount)
            putArray(
              "users",
              argArr().pushMapList(
                users.users?.map {
                  argMap().apply {
                    putString("uuid", it.uuid)
                    putD("id", it.id?.toDouble())
                    putB("favorite", it.favorite)
                    putString("profileNickname", it.profileNickname)
                    putString("profileThumbnailImage", it.profileThumbnailImage)
                  }
                } ?: listOf(),
              ),
            )
          },
        )
      }
    }

    PickerClient.instance.selectFriend(
      context,
      getParams(multiple, options),
      if (mode == "popup") POPUP else FULL,
      callback,
    )
  }

  private fun getParams(
    multiple: Boolean,
    options: ReadableMap?,
  ) = OpenPickerFriendRequestParams(
    viewAppearance =
      when (options?.getString("viewAppearance")) {
        "dark" -> DARK
        "light" -> LIGHT
        else -> AUTO
      },
    orientation =
      when (options?.getString("orientation")) {
        "portrait" -> PORTRAIT
        "landscape" -> LANDSCAPE
        else -> PickerOrientation.AUTO
      },
    enableSearch = options?.getBooleanElseNull("enableSearch") ?: true,
    showMyProfile = options?.getBooleanElseNull("showMyProfile") ?: true,
    showFavorite = options?.getBooleanElseNull("showFavorite") ?: true,
    showPickedFriend = options?.getBooleanElseNull("showPickedFriend") ?: true,
    selectParams =
      if (multiple) {
        SelectParams.friend(
          mode = MULTIPLE,
          minPickableCount = options?.getIntElseNull("minPickableCount") ?: 1,
          maxPickableCount = options?.getIntElseNull("maxPickableCount") ?: 30,
        )
      } else {
        SelectParams.friend(SINGLE)
      },
  )

  @ReactMethod
  override fun getFriends(
    options: ReadableMap?,
    promise: Promise,
  ) = onMain {
    TalkApiClient.instance.friends(
      offset = options?.getIntElseNull("offset"),
      limit = options?.getIntElseNull("limit"),
      order =
        when (options?.getString("order")) {
          "asc" -> Order.ASC
          "desc" -> Order.DESC
          else -> null
        },
      friendOrder =
        when (options?.getString("friendOrder")) {
          "nickname" -> FriendOrder.NICKNAME
          "age" -> FriendOrder.AGE
          "favorite" -> FriendOrder.FAVORITE
          else -> null
        },
    ) { friends, error ->
      if (error != null) {
        promise.rejectWith(error)
      } else if (friends?.elements == null) {
        promise.rejectWith(RNCKakaoResponseNotFoundException("friends"))
      } else {
        promise.resolve(
          argMap().apply {
            putInt("totalCount", friends.totalCount)
            putI("favoriteCount", friends.favoriteCount)
            putArray(
              "friends",
              argArr().pushMapList(
                friends.elements!!.map {
                  argMap().apply {
                    putD("id", it.id?.toDouble())
                    putString("uuid", it.uuid)
                    putString("profileNickname", it.profileNickname)
                    putString("profileThumbnailImage", it.profileThumbnailImage)
                    putB("favorite", it.favorite)
                    putB("allowedMsg", it.allowedMsg)
                  }
                },
              ),
            )
          },
        )
      }
    }
  }
}
