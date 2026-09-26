require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
corePackage = JSON.parse(File.read(File.join(__dir__, "..", "core", "package.json")))
sdk_version = corePackage['sdkVersions']['ios']['user']

Pod::Spec.new do |s|
  s.name         = "RNCKakaoUser"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/mym0404/react-native-kakao.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  install_modules_dependencies(s)

  # Override Version by User
  if defined?($KakaoUserSDKVersion)
    Pod::UI.puts "#{s.name}: Using user specified Kakao SDK version '#{$KakaoUserSDKVersion}'"
    sdk_version = $KakaoUserSDKVersion
  end

  s.dependency          'RNCKakaoCore'

  # Kakao dependencies
  s.dependency          'KakaoSDKUser', sdk_version
end
