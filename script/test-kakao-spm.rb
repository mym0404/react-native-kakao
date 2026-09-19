# Run with: mise exec -- ruby script/test-kakao-spm.rb
require 'cocoapods'
require 'tmpdir'
require_relative '../node_modules/react-native/scripts/cocoapods/spm'
require_relative '../packages/core/ios/kakao-sdk'

def spm_dependency(spec, **options)
  SPM.dependency(spec, **options)
end

def min_ios_version_supported
  '13.4'
end

deployment_target = '15.0'
core_name = 'RNCKakaoCore'
conflicting_version = '2.28.0'
specs = Dir[File.expand_path('../packages/*/*.podspec', __dir__)].map { |path| Pod::Specification.from_file(path) }
raise 'iOS floor missing' unless specs.all? { |spec| spec.deployment_target(:ios) == deployment_target }
dependencies = SPM.instance_variable_get(:@dependencies_by_pod)
raise 'SDK linked more than once' unless dependencies.keys == [core_name]
products = dependencies.values.flatten.flat_map { |dependency| dependency[:products] }.uniq.sort
raise 'Missing transitive product' unless products == %w[Alamofire KakaoSDKAuth KakaoSDKCommon KakaoSDKFriend KakaoSDKFriendCore KakaoSDKNavi KakaoSDKShare KakaoSDKTalk KakaoSDKTemplate KakaoSDKUser].sort

['~> 2.29', conflicting_version, nil, ['2.29.0', conflicting_version]].each do |version|
  begin
    RNCKakaoSPM.dependency(specs.first, version, [])
  rescue Pod::Informative
    next
  end
  raise "Accepted invalid or conflicting version: #{version.inspect}"
end

Dir.mktmpdir('kakao-spm-test') do |directory|
  pods = Pod::Project.new(File.join(directory, 'Pods.xcodeproj'))
  core = pods.new_target(:static_library, core_name, :ios, deployment_target)
  app = Xcodeproj::Project.new(File.join(directory, 'App.xcodeproj'))
  target = app.new_target(:application, 'App', :ios, deployment_target)
  aggregate = Struct.new(:pod_targets, :user_targets, :user_project).new(
    [Struct.new(:pod_name).new('RNCKakaoSocial')], [target], app
  )
  installer = Struct.new(:pods_project, :aggregate_targets).new(pods, [aggregate])
  Pod::Installer::TargetUUIDGenerator.new([pods]).generate!
  root = pods.root_object
  2.times { SPM.apply_on_post_install(installer) }
  101.times { pods.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference) }
  raise 'Root project UUID overwritten' unless pods.objects_by_uuid[root.uuid].equal?(root)
  raise 'Duplicate products' unless core.package_product_dependencies.map(&:product_name).sort == products
  phases = target.shell_script_build_phases.select { |phase| phase.name == '[RNCKakao] Copy Friend Resources' }
  raise 'Resource phase duplicated' unless phases.length == 1

  packages = File.join(directory, 'SourcePackages')
  bundle = 'KakaoSDKFriendResources.bundle'
  source = File.join(packages, 'checkouts/kakao-ios-sdk/Sources/KakaoSDKFriendCore', bundle)
  FileUtils.mkdir_p(source)
  File.write(File.join(source, 'Assets.car'), 'resource probe')
  podspecs = File.join(directory, 'Local Podspecs')
  FileUtils.mkdir_p(podspecs)
  File.write(File.join(podspecs, 'RNCKakaoSocial.podspec.json'), '{}')
  env = {
    'PODS_ROOT' => directory, 'BUILD_DIR' => File.join(directory, 'Build/Products'),
    'TARGET_BUILD_DIR' => directory, 'UNLOCALIZED_RESOURCES_FOLDER_PATH' => 'App.app'
  }
  custom_directory = File.join(directory, 'custom packages')
  [nil, nil, custom_directory].each_with_index do |custom_packages, index|
    env['BUILD_DIR'] = File.join(directory, 'Build/Intermediates.noindex/ArchiveIntermediates/App/BuildProductsPath') if index == 1
    FileUtils.mv(packages, custom_directory) if custom_packages
    raise 'Resource copy failed' unless system(env.merge('KAKAO_SPM_SOURCE_PACKAGES_DIR' => custom_packages), '/bin/sh', '-c', phases.first.shell_script)
    raise 'Resource missing' unless File.read(File.join(directory, 'App.app', bundle, 'Assets.car')) == 'resource probe'
  end
end
puts 'Kakao SPM checks passed'
