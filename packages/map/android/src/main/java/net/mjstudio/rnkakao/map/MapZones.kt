package net.mjstudio.rnkakao.map

import android.graphics.PointF
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.zone.ZoneEvent
import expo.modules.kotlin.exception.CodedException

class MapZones(
  private var map: KakaoMap?,
  private val onEnter: (Map<String, Any>) -> Unit,
  private val onLeave: (Map<String, Any>) -> Unit,
) {
  init {
    map?.setOnZoneEventListener(
      object : KakaoMap.OnZoneEventListener {
        override fun onZoneCreated(
          kakaoMap: KakaoMap,
          event: ZoneEvent,
        ) {
          onEnter(event.payload())
        }

        override fun onZoneRemoved(
          kakaoMap: KakaoMap,
          event: ZoneEvent,
        ) {
          onLeave(event.payload())
        }
      },
    )
  }

  fun setCheckRectScale(
    zoneType: String,
    level: Int,
    x: Double,
    y: Double,
  ) {
    if (zoneType.isBlank() || level !in 0..21 || !x.toFloat().isFinite() || !y.toFloat().isFinite() || x <= 0 || y <= 0) {
      throw CodedException(INVALID_ARGUMENT, "Invalid zone check rectangle scale.", null)
    }
    manager().setZoneBoundScale(zoneType, level, PointF(x.toFloat(), y.toFloat()))
  }

  fun showDetail(
    zoneType: String,
    zoneId: String,
    detailId: String,
  ) {
    if (zoneType.isBlank() || zoneId.isBlank() || detailId.isBlank()) {
      throw CodedException(INVALID_ARGUMENT, "Zone type, zone ID, and detail ID are required.", null)
    }
    manager().showDetailZone(zoneType, zoneId, detailId)
  }

  fun hideDetail(zoneType: String) {
    if (zoneType.isBlank()) throw CodedException(INVALID_ARGUMENT, "Zone type is required.", null)
    manager().hideDetailZone(zoneType)
  }

  fun dispose() {
    map?.setOnZoneEventListener(null)
    map = null
  }

  private fun manager() =
    map?.zoneManager
      ?: throw CodedException("ERR_KAKAO_MAP_VIEW_DESTROYED", "The map view was destroyed.", null)
}

private fun ZoneEvent.payload() =
  mapOf(
    "zoneType" to zoneType,
    "zoneId" to zoneId,
    "detailId" to detailZoneId,
    "details" to detailZones.toList(),
    "links" to
      linkingInfo.mapValues { (_, links) ->
        links.map { mapOf("zoneId" to it.zoneId, "detailId" to it.detailId) }
      },
  )
