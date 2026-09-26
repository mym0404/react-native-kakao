require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
corePackage = JSON.parse(File.read(File.join(__dir__, "..", "core", "package.json")))
sdk_version = corePackage['sdkVersions']['ios']['core']

Pod::Spec.new do |s|
  s.name         = "RNCKakaoCore"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/mym0404/react-native-kakao.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.private_header_files = "ios/RNCKakaoCore.h"

  unless NewArchitectureHelper.new_arch_enabled
    raise Pod::Informative, "RNCKakaoCore requires React Native's New Architecture."
  end

  install_modules_dependencies(s)

  # Override Version by User
  if defined?($KakaoCoreSDKVersion)
    Pod::UI.puts "#{s.name}: Using user specified Kakao SDK version '#{$KakaoCoreSDKVersion}'"
    sdk_version = $KakaoCoreSDKVersion
  end

  # Kakao dependencies
  s.dependency          'KakaoSDKCommon', sdk_version
end
