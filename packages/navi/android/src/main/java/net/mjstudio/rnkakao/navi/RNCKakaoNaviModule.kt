package net.mjstudio.rnkakao.navi

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.kakao.sdk.navi.Constants
import com.kakao.sdk.navi.NaviClient
import com.kakao.sdk.navi.model.CoordType.KATEC
import com.kakao.sdk.navi.model.CoordType.WGS84
import com.kakao.sdk.navi.model.Location
import com.kakao.sdk.navi.model.NaviOption
import com.kakao.sdk.navi.model.RpOption
import com.kakao.sdk.navi.model.VehicleType.FIFTH
import com.kakao.sdk.navi.model.VehicleType.FIRST
import com.kakao.sdk.navi.model.VehicleType.FOURTH
import com.kakao.sdk.navi.model.VehicleType.SECOND
import com.kakao.sdk.navi.model.VehicleType.SIXTH
import com.kakao.sdk.navi.model.VehicleType.THIRD
import com.kakao.sdk.navi.model.VehicleType.TWO_WHEEL
import net.mjstudio.rnkakao.core.util.filterIsReadableMap
import net.mjstudio.rnkakao.core.util.getBooleanElseNull
import net.mjstudio.rnkakao.core.util.getDoubleElseNull
import net.mjstudio.rnkakao.core.util.onMain
import net.mjstudio.rnkakao.core.util.rejectWith

class RNCKakaoNaviModule internal constructor(
  context: ReactApplicationContext,
) : KakaoNaviSpec(context) {
  override fun getName(): String = NAME

  @ReactMethod
  override fun navigateOrShareTo(
    destination: ReadableMap,
    option: ReadableMap?,
    viaList: ReadableArray?,
    openWebInstallUrlIfNaviAppNotAvailable: Boolean?,
    isShare: Boolean?,
    promise: Promise,
  ) = onMain {
    val context =
      currentActivity ?: run {
        promise.rejectWith(ActivityNotFoundException())
        return@onMain
      }

    if (NaviClient.instance.isKakaoNaviInstalled(reactApplicationContext)) {
      if (isShare == true) {
        context.startActivity(
          NaviClient.instance.shareDestinationIntent(
            destination.toLocation(),
            option?.toOption(),
            viaList?.filterIsReadableMap()?.map { it.toLocation() },
          ),
        )
      } else {
        context.startActivity(
          NaviClient.instance.navigateIntent(
            destination.toLocation(),
            option?.toOption(),
            viaList?.filterIsReadableMap()?.map { it.toLocation() },
          ),
        )
      }
      promise.resolve(true)
    } else if (openWebInstallUrlIfNaviAppNotAvailable == true) {
      context.startActivity(
        Intent(
          Intent.ACTION_VIEW,
          Uri.parse(Constants.WEB_NAVI_INSTALL),
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
      )
      promise.resolve(false)
    } else {
      promise.resolve(false)
    }
  }

  companion object {
    const val NAME = "RNCKakaoNavi"
  }
}

private fun ReadableMap.toLocation() =
  Location(
    name = getString("name") ?: "",
    rpFlag = getString("rpFlag"),
    x = getDoubleElseNull("x")!!.toString(),
    y = getDoubleElseNull("y")!!.toString(),
  )

private fun ReadableMap.toOption() =
  NaviOption(
    coordType =
      when (getString("coordType")) {
        "WGS84" -> WGS84
        "KATEC" -> KATEC
        else -> null
      },
    vehicleType =
      when (getString("vehicleType")) {
        "First" -> FIRST
        "Second" -> SECOND
        "Third" -> THIRD
        "Fourth" -> FOURTH
        "Fifth" -> FIFTH
        "Sixth" -> SIXTH
        "TwoWheel" -> TWO_WHEEL
        else -> null
      },
    rpOption =
      when (getString("rpOption")) {
        "Fast" -> RpOption.FAST
        "Free" -> RpOption.FREE
        "Shortest" -> RpOption.SHORTEST
        "NoAuto" -> RpOption.NO_AUTO
        "Wide" -> RpOption.WIDE
        "Highway" -> RpOption.HIGHWAY
        "Normal" -> RpOption.NORMAL
        "Recommended" -> RpOption.RECOMMENDED
        else -> null
      },
    routeInfo = getBooleanElseNull("routeInfo"),
    startX = getDoubleElseNull("startX")?.toString(),
    startY = getDoubleElseNull("startY")?.toString(),
    startAngle = getDoubleElseNull("startAngle")?.toInt(),
    returnUri = getString("returnUri"),
  )
