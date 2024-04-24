import Foundation
import KakaoSDKNavi
import React
import RNCKakaoCore

@objc public class RNCKakaoNaviManager: NSObject {
  @objc public static let shared = RNCKakaoNaviManager()

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
      debugE(createLocation(dest))
      guard let navigateUrl = isShare ? NaviApi.shared.shareUrl(
        destination: createLocation(dest),
        option: createOption(options: opts),
        viaList: via?.map { createLocation($0) }
      ) : NaviApi.shared.navigateUrl(
        destination: createLocation(dest),
        option: createOption(options: opts),
        viaList: via?.map { createLocation($0) }
      ) else {
        RNCKakaoUtil.reject(reject, "Failed to create construct navigateUrl")
        return
      }

      if UIApplication.shared.canOpenURL(navigateUrl) {
        UIApplication.shared.open(navigateUrl) { success in
          if success {
            resolve(true)
          } else {
            RNCKakaoUtil.reject(reject, "Failed to open navigateUrl \(navigateUrl)")
          }
        }
      } else if openWebInstallUrlIfNaviAppNotAvailable {
        UIApplication.shared.open(NaviApi.webNaviInstallUrl) { success in
          if success {
            resolve(false)
          } else {
            RNCKakaoUtil.reject(reject, "Failed to open webNaviInstallUrl")
          }
        }
      } else {
        resolve(false)
      }
    }
  }
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
