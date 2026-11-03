require "json"
require_relative "../core/ios/kakao-sdk"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
core_package = JSON.parse(File.read(File.join(__dir__, "..", "core", "package.json")))
sdk_version = core_package['sdkVersions']['ios']['cert']

Pod::Spec.new do |s|
  s.name = "RNCKakaoCert"
  s.version = package["version"]
  s.summary = package["description"]
  s.homepage = package["homepage"]
  s.license = package["license"]
  s.authors = package["author"]
  s.platforms = { :ios => min_ios_version_supported }
  s.source = { :git => "https://github.com/mym0404/react-native-kakao.git", :tag => "#{s.version}" }
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.private_header_files = "ios/RNCKakaoCert.h"

  install_modules_dependencies(s)
  sdk_version = $KakaoCertSDKVersion if defined?($KakaoCertSDKVersion)
  s.dependency 'RNCKakaoCore'
  s.dependency 'RNCKakaoUser'
  RNCKakaoSPM.dependency(s, sdk_version, %w[KakaoSDKCommon KakaoSDKAuth KakaoSDKUser KakaoSDKCert KakaoSDKCertCore])
end
