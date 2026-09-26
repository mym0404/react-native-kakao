require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
corePackage = JSON.parse(File.read(File.join(__dir__, "..", "core", "package.json")))

friend_sdk_version = corePackage['sdkVersions']['ios']['friend']
talk_sdk_version = corePackage['sdkVersions']['ios']['talk']

Pod::Spec.new do |s|
  s.name         = "RNCKakaoSocial"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/mym0404/react-native-kakao.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.private_header_files = "ios/RNCKakaoSocial.h"

  install_modules_dependencies(s)

  # Override Version by User
  if defined?($KakaoFriendSDKVersion)
    Pod::UI.puts "#{s.name}: Using user specified Kakao SDK version '#{$KakaoFriendSDKVersion}'"
    friend_sdk_version = $KakaoFriendSDKVersion
  end
  if defined?($KakaoTalkSDKVersion)
    Pod::UI.puts "#{s.name}: Using user specified Kakao SDK version '#{$KakaoTalkSDKVersion}'"
    talk_sdk_version = $KakaoTalkSDKVersion
  end

  s.dependency          'RNCKakaoCore'
  s.dependency          'RNCKakaoUser'

  # Kakao dependencies
  s.dependency          'KakaoSDKFriend', friend_sdk_version
  s.dependency          'KakaoSDKTalk',   talk_sdk_version
end
