package net.mjstudio.rnkakao.share

import com.facebook.react.bridge.ReadableMap
import com.kakao.sdk.template.model.Button
import com.kakao.sdk.template.model.CalendarTemplate
import com.kakao.sdk.template.model.Commerce
import com.kakao.sdk.template.model.CommerceTemplate
import com.kakao.sdk.template.model.Content
import com.kakao.sdk.template.model.DefaultTemplate
import com.kakao.sdk.template.model.FeedTemplate
import com.kakao.sdk.template.model.IdType.CALENDAR
import com.kakao.sdk.template.model.IdType.EVENT
import com.kakao.sdk.template.model.ItemContent
import com.kakao.sdk.template.model.ItemInfo
import com.kakao.sdk.template.model.Link
import com.kakao.sdk.template.model.ListTemplate
import com.kakao.sdk.template.model.LocationTemplate
import com.kakao.sdk.template.model.Social
import com.kakao.sdk.template.model.TextTemplate
import net.mjstudio.rnkakao.core.util.RNCKakaoUnknownException
import net.mjstudio.rnkakao.core.util.filterIsReadableMap
import net.mjstudio.rnkakao.core.util.getIntElseNull
import net.mjstudio.rnkakao.core.util.toStringMap

object RNCKakaoShareTemplates {
  fun createDefaultTemplate(
    template: ReadableMap,
    templateType: String,
  ): DefaultTemplate =
    when (templateType) {
      "feed" -> createFeedTemplate(template)
      "list" -> createListTemplate(template)
      "location" -> createLocationTemplate(template)
      "commerce" -> createCommerceTemplate(template)
      "text" -> createTextTemplate(template)
      "calendar" -> createCalendarTemplate(template)
      else -> throw RNCKakaoUnknownException("Unknown templateType: $templateType")
    }

  private fun ReadableMap.toLink() =
    Link(
      webUrl = getString("webUrl"),
      mobileWebUrl = getString("mobileWebUrl"),
      androidExecutionParams = getMap("androidExecutionParams")?.toStringMap(),
      iosExecutionParams = getMap("iosExecutionParams")?.toStringMap(),
    )

  private fun ReadableMap.toContent() =
    Content(
      title = getString("title"),
      imageUrl = getString("imageUrl"),
      link = getMap("link")?.toLink() ?: Link(),
      description = getString("description"),
      imageWidth = getIntElseNull("imageWidth"),
      imageHeight = getIntElseNull("imageHeight"),
    )

  private fun ReadableMap.toItemInfo() =
    ItemInfo(
      item = getString("item") ?: "",
      itemOp = getString("itemOp") ?: "",
    )

  private fun ReadableMap.toItemContent() =
    ItemContent(
      profileText = getString("profileText"),
      profileImageUrl = getString("profileImageUrl"),
      titleImageText = getString("titleImageText"),
      titleImageUrl = getString("titleImageUrl"),
      titleImageCategory = getString("titleImageCategory"),
      items = getArray("items")?.filterIsReadableMap()?.map { it.toItemInfo() },
      sum = getString("sum"),
      sumOp = getString("sumOp"),
    )

  private fun ReadableMap.toSocial() =
    Social(
      likeCount = getIntElseNull("likeCount"),
      commentCount = getIntElseNull("commentCount"),
      sharedCount = getIntElseNull("sharedCount"),
      viewCount = getIntElseNull("viewCount"),
      subscriberCount = getIntElseNull("subscriberCount"),
    )

  private fun ReadableMap.toButton() =
    Button(
      title = getString("title") ?: "",
      link = getMap("link")?.toLink() ?: Link(),
    )

  private fun ReadableMap.toCommerce() =
    Commerce(
      regularPrice = getIntElseNull("regularPrice") ?: 0,
      discountPrice = getIntElseNull("discountPrice"),
      fixedDiscountPrice = getIntElseNull("fixedDiscountPrice"),
      discountRate = getIntElseNull("discountRate"),
      productName = getString("productName"),
      currencyUnit = getString("currencyUnit"),
      currencyUnitPosition = getIntElseNull("currencyUnitPosition"),
    )

  private fun createFeedTemplate(map: ReadableMap) =
    FeedTemplate(
      content = map.getMap("content")!!.toContent(),
      itemContent = map.getMap("itemContent")?.toItemContent(),
      social = map.getMap("social")?.toSocial(),
      buttons = map.getArray("buttons")?.filterIsReadableMap()?.map { it.toButton() },
      buttonTitle = map.getString("buttonTitle"),
    )

  private fun createListTemplate(map: ReadableMap): ListTemplate {
    return ListTemplate(
      headerTitle = map.getString("headerTitle") ?: "",
      headerLink = map.getMap("headerLink")?.toLink() ?: Link(),
      contents =
        map.getArray("contents")?.filterIsReadableMap()?.map { it.toContent() }
          ?: listOf(),
      buttons = map.getArray("buttons")?.filterIsReadableMap()?.map { it.toButton() },
      buttonTitle = map.getString("buttonTitle"),
    )
  }

  private fun createLocationTemplate(map: ReadableMap) =
    LocationTemplate(
      address = map.getString("address") ?: "",
      content = map.getMap("content")!!.toContent(),
      addressTitle = map.getString("addressTitle"),
      social = map.getMap("social")?.toSocial(),
      buttons = map.getArray("buttons")?.filterIsReadableMap()?.map { it.toButton() },
      buttonTitle = map.getString("buttonTitle"),
    )

  private fun createCommerceTemplate(map: ReadableMap) =
    CommerceTemplate(
      content = map.getMap("content")!!.toContent(),
      commerce = map.getMap("commerce")!!.toCommerce(),
      buttons = map.getArray("buttons")?.filterIsReadableMap()?.map { it.toButton() },
      buttonTitle = map.getString("buttonTitle"),
    )

  private fun createTextTemplate(map: ReadableMap) =
    TextTemplate(
      text = map.getString("text") ?: "",
      link = map.getMap("link")?.toLink() ?: Link(),
      buttons = map.getArray("buttons")?.filterIsReadableMap()?.map { it.toButton() },
      buttonTitle = map.getString("buttonTitle"),
    )

  private fun createCalendarTemplate(map: ReadableMap) =
    CalendarTemplate(
      id = map.getString("id")!!,
      idType = if (map.getString("id") == "event") EVENT else CALENDAR,
      content = map.getMap("content")!!.toContent(),
      buttons = map.getArray("buttons")?.filterIsReadableMap()?.map { it.toButton() },
    )
}
