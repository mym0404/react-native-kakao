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

PodTargetProbe = Struct.new(:pod_name, :label, :dependent_targets) do
  def configuration_build_dir
    "${PODS_CONFIGURATION_BUILD_DIR}/#{label}"
  end
end
AggregateProbe = Struct.new(:pod_targets, :user_targets, :user_project)
InstallerProbe = Struct.new(:pods_project, :aggregate_targets, :pod_targets)

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
  core_pod = PodTargetProbe.new(core_name, core_name, [])
  social_name = 'RNCKakaoSocial'
  social_pod = PodTargetProbe.new(social_name, social_name, [core_pod])
  social = pods.new_target(:static_library, social_name, :ios, deployment_target)
  aggregate = AggregateProbe.new([core_pod, social_pod], [target], app)
  installer = InstallerProbe.new(pods, [aggregate], [core_pod, social_pod])
  Pod::Installer::TargetUUIDGenerator.new([pods]).generate!
  root = pods.root_object
  2.times { SPM.apply_on_post_install(installer) }
  101.times { pods.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference) }
  raise 'Root project UUID overwritten' unless pods.objects_by_uuid[root.uuid].equal?(root)
  raise 'Duplicate products' unless core.package_product_dependencies.map(&:product_name).sort == products
  raise 'Dependency registry changed' unless SPM.instance_variable_get(:@dependencies_by_pod).equal?(dependencies)
  raise 'Dependent linked SDK twice' unless social.package_product_dependencies.empty?
  raise 'Core framework path missing' unless social.build_configurations.all? { |config| config.build_settings['FRAMEWORK_SEARCH_PATHS'].include?("\"#{core_pod.configuration_build_dir}\"") }
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

  variants = %w[AppA AppB].map do |name|
    scoped_core = PodTargetProbe.new(core_name, "#{core_name}-#{name}", [])
    scoped_social = PodTargetProbe.new(social_name, "#{social_name}-#{name}", [scoped_core])
    [scoped_core, scoped_social].each { |pod| pods.new_target(:static_library, pod.label, :ios, deployment_target) }
    user = app.new_target(:application, name, :ios, deployment_target)
    AggregateProbe.new([scoped_core, scoped_social], [user], app)
  end
  core.remove_from_project
  social.remove_from_project
  installer.pod_targets = variants.flat_map(&:pod_targets)
  installer.aggregate_targets = variants
  2.times { SPM.apply_on_post_install(installer) }
  variants.each do |variant|
    scoped_core, scoped_social = variant.pod_targets
    core_target = pods.targets.find { |item| item.name == scoped_core.label }
    social_target = pods.targets.find { |item| item.name == scoped_social.label }
    raise 'Scoped Core products missing or duplicated' unless core_target.package_product_dependencies.map(&:product_name).sort == products
    raise 'Scoped SDK linked twice' unless social_target.package_product_dependencies.empty?
    raise 'Wrong scoped Core path' unless social_target.build_configurations.all? { |config| config.build_settings['FRAMEWORK_SEARCH_PATHS'] == ['$(inherited)', "\"#{scoped_core.configuration_build_dir}\""] }
  end
  raise 'Scoped registry leaked' unless SPM.instance_variable_get(:@dependencies_by_pod).equal?(dependencies)

  first = variants.first
  first.pod_targets = [first.pod_targets.first]
  shared = AggregateProbe.new(variants.last.pod_targets, first.user_targets, app)
  installer.aggregate_targets = [*variants, shared]
  SPM.apply_on_post_install(installer)
  phase_name = '[RNCKakao] Copy Friend Resources'
  raise 'Shared user target lost resources' unless first.user_targets.first.shell_script_build_phases.count { |phase| phase.name == phase_name } == 1
  installer.aggregate_targets = variants
  SPM.apply_on_post_install(installer)
  raise 'Removed Social phase retained' unless first.user_targets.first.shell_script_build_phases.none? { |phase| phase.name == phase_name }
  raise 'Other app lost Social phase' unless variants.last.user_targets.first.shell_script_build_phases.count { |phase| phase.name == phase_name } == 1

  SPM.instance_variable_set(:@dependencies_by_pod, {})
  RNCKakaoSPM.dependency(specs.find { |spec| spec.name == core_name }, '2.29.0', ['KakaoSDKCommon'])
  subset = Pod::Project.new(File.join(directory, 'Subset.xcodeproj'))
  subset_core = subset.new_target(:static_library, core_name, :ios, deployment_target)
  SPM.apply_on_post_install(InstallerProbe.new(subset, [], [core_pod]))
  raise 'Core-only install links optional products' unless subset_core.package_product_dependencies.map(&:product_name).sort == %w[Alamofire KakaoSDKCommon]
end
puts 'Kakao SPM checks passed'
