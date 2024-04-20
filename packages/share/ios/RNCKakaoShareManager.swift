import Foundation
import KakaoSDKShare

@objc public class RNCKakaoShareManager: NSObject {
  @objc public static let shared = RNCKakaoShareManager()

  @objc public func go() {
//    // 카카오톡 설치여부 확인
//    if ShareApi.isKakaoTalkSharingAvailable() {
//      // 카카오톡으로 카카오톡 공유 가능
//      ShareApi.shared.shareCustom(
//        templateId: templateId,
//        templateArgs: ["title": "제목입니다.", "description": "설명입니다."]
//      ) { sharingResult, error in
//        if let error {
//          print(error)
//        } else {
//          print("shareCustom() success.")
//          if let sharingResult {
//            UIApplication.shared.open(sharingResult.url, options: [:], completionHandler: nil)
//          }
//        }
//      }
//    } else {
//      // 카카오톡 미설치: 웹 공유 사용 권장
//      // Custom WebView 또는 디폴트 브라우져 사용 가능
//      // 웹 공유 예시 코드
//      if let url = ShareApi.shared.makeCustomUrl(
//        templateId: templateId,
//        templateArgs: ["title": "제목입니다.", "description": "설명입니다."]
//      ) {
//        safariViewController = SFSafariViewController(url: url)
//        safariViewController?.modalTransitionStyle = .crossDissolve
//        safariViewController?.modalPresentationStyle = .overCurrentContext
//        present(safariViewController!, animated: true) {
//          print("웹 present success")
//        }
//      }
//    }
  }
}
