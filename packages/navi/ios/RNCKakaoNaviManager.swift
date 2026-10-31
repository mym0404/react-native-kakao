import Foundation
import KakaoSDKNavi
import React
import RNCKakaoCore
import UIKit

private let naviUrlCreationErrorMessage = "Failed to create Navi URL"

@objc public class RNCKakaoNaviManager: NSObject {
  @objc public static let shared = RNCKakaoNaviManager()

  @objc public func isKakaoNaviInstalled(_ resolve: @escaping RCTPromiseResolveBlock) {
    onMain {
      resolve(UIApplication.shared.canOpenURL(URL(string: "kakaonavi-sdk://")!))
    }
  }

  @objc public func makeNaviUrl(
    _ dest: [String: Any],
    isShare: Bool,
    option opts: [String: Any]?,
    viaList via: [[String: Any]]?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      guard let url = createNaviUrl(
        destination: dest,
        option: opts,
        viaList: via,
        isShare: isShare
      ) else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.unknown(naviUrlCreationErrorMessage))
        return
      }
      resolve(url.absoluteString)
    }
  }

  @objc public func navigateOrShareTo(
    _ dest: [String: Any],
    option opts: [String: Any]?,
    viaList via: [[String: Any]]?,
    openWebInstallUrlIfNaviAppNotAvailable: Bool,
    isShare: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    onMain {
      guard let navigateUrl = createNaviUrl(
        destination: dest, option: opts, viaList: via, isShare: isShare
      ) else {
        RNCKakaoUtil.reject(reject, RNCKakaoError.unknown(naviUrlCreationErrorMessage))
        return
      }

      if UIApplication.shared.canOpenURL(navigateUrl) {
        UIApplication.shared.open(navigateUrl) { success in
          if success {
            resolve(true)
          } else {
            RNCKakaoUtil.reject(
              reject,
              RNCKakaoError.unknown("Failed to open navigateUrl \(navigateUrl)")
            )
          }
        }
      } else if openWebInstallUrlIfNaviAppNotAvailable {
        UIApplication.shared.open(NaviApi.webNaviInstallUrl) { success in
          if success {
            resolve(false)
          } else {
            RNCKakaoUtil.reject(reject, RNCKakaoError.unknown("Failed to open webNaviInstallUrl"))
          }
        }
      } else {
        resolve(false)
      }
    }
  }
}

private func createNaviUrl(
  destination: [String: Any],
  option: [String: Any]?,
  viaList: [[String: Any]]?,
  isShare: Bool
) -> URL? {
  let destination = createLocation(destination)
  let option = createOption(options: option)
  let viaList = viaList?.map { createLocation($0) }
  return isShare
    ? NaviApi.shared.shareUrl(destination: destination, option: option, viaList: viaList)
    : NaviApi.shared.navigateUrl(destination: destination, option: option, viaList: viaList)
}

private func createOption(options: [String: Any]?) -> NaviOption? {
  guard let options else { return nil }

  let coordType = options["coordType"] as? String
  let vehicleType: VehicleType? = switch options["vehicleType"] as? String {
  case "First": .First
  case "Second": .Second
  case "Third": .Third
  case "Fourth": .Fourth
  case "Fifth": .Fifth
  case "Sixth": .Sixth
  case "TwoWheel": .TwoWheel
  default: nil
  }
  let rpOption: RpOption? = switch options["rpOption"] as? String {
  case "Fast": .Fast
  case "Free": .Free
  case "Shortest": .Shortest
  case "NoAuto": .NoAuto
  case "Wide": .Wide
  case "Highway": .Highway
  case "Normal": .Normal
  case "Recommended": .Recommended
  default: nil
  }
  let startX: String? = switch options["startX"] {
  case let s as Double: String(s)
  default: nil
  }
  let startY: String? = switch options["startY"] {
  case let s as Double: String(s)
  default: nil
  }

  return NaviOption(
    coordType: coordType == "WGS84" ? .WGS84 : coordType == "KATEC" ? .KATEC : nil,
    vehicleType: vehicleType,
    rpOption: rpOption,
    routeInfo: options["routeInfo"] as? Bool,
    startX: startX,
    startY: startY,
    startAngle: options["startAngle"] as? Int,
    returnUri: URL(string: options["returnUri"] as? String ?? "")
  )
}

private func createLocation(_ dict: [String: Any]) -> NaviLocation {
  NaviLocation(
    name: dict["name"] as! String,
    x: String(dict["x"] as! Double),
    y: String(dict["y"] as! Double),
    rpflag: dict["rpflag"] as? String
  )
}
