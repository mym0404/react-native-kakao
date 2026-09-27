require 'shellwords'

module RNCKakaoSPM
  CORE_NAME = 'RNCKakaoCore'
  RESOURCE_BUNDLES = {
    friend: {
      phase: '[RNCKakao] Copy Friend Resources',
      path: 'kakao-ios-sdk/Sources/KakaoSDKFriendCore/KakaoSDKFriendResources.bundle'
    }.freeze
  }.freeze

  module Integration
    def apply_on_post_install(installer)
      # TargetUUIDGenerator resets @generated_uuids but retains project objects.
      # CocoaPods' counter can then reuse live IDs; Xcodeproj checks for collisions.
      installer.pods_project.define_singleton_method(
        :generate_available_uuid_list,
        Xcodeproj::Project.instance_method(:generate_available_uuid_list)
      )
      # React Native matches native target names, including CocoaPods' scoped variants.
      dependencies = @dependencies_by_pod
      @dependencies_by_pod = dependencies.reject { |name, _| name == CORE_NAME }
      installer.pod_targets.each do |pod|
        if pod.pod_name == CORE_NAME
          @dependencies_by_pod[pod.label] = dependencies.fetch(CORE_NAME)
        end
        next unless pod.pod_name.start_with?('RNCKakao')

        core = ([pod] + pod.dependent_targets).find { |dependency| dependency.pod_name == CORE_NAME }
        next unless core

        target = installer.pods_project.targets.find { |item| item.name == pod.label }
        target.build_configurations.each do |config|
          # SPM stages KakaoSDKFriendCore.framework in its consumer Core's build directory,
          # even when Core itself is a static library. Other pods import it through KakaoSDKFriend.
          paths = Array(config.build_settings['FRAMEWORK_SEARCH_PATHS'] || '$(inherited)')
          config.build_settings['FRAMEWORK_SEARCH_PATHS'] = (paths + ["\"#{core.configuration_build_dir}\""]).uniq
        end
      end
      begin
        super
      ensure
        @dependencies_by_pod = dependencies
      end

      RNCKakaoSPM.copy_resources(installer)
    end
  end

  def self.copy_resources(installer)
    RESOURCE_BUNDLES.each do |resource, bundle|
      pod_names = (@resources_by_pod || {}).filter_map { |pod, resources| pod if resources.include?(resource) }
      resource_targets = {}
      installer.aggregate_targets.each do |aggregate|
        has_resource = aggregate.pod_targets.any? { |target| pod_names.include?(target.pod_name) }
        aggregate.user_targets.each do |target|
          resource_targets[target] = resource_targets.fetch(target, false) || has_resource
        end
      end
      resource_targets.each do |target, has_resource|
        phase_name = bundle.fetch(:phase)
        phase = target.shell_script_build_phases.find { |item| item.name == phase_name }
        unless has_resource
          phase&.remove_from_project
          next
        end
        phase ||= target.new_shell_script_build_phase(phase_name)
        phase.always_out_of_date = '1'
        phase.shell_script = "resource_path=#{bundle.fetch(:path).shellescape}\nset -- #{pod_names.map(&:shellescape).join(' ')}\n" + <<~'SH'
          set -eu
          has_pod=false
          for pod in "$@"; do
            if [ -f "${PODS_ROOT}/Local Podspecs/${pod}.podspec.json" ]; then has_pod=true; fi
          done
          "$has_pod" || exit 0
          # Custom -clonedSourcePackagesDirPath builds must pass the same path as KAKAO_SPM_SOURCE_PACKAGES_DIR.
          packages="${KAKAO_SPM_SOURCE_PACKAGES_DIR:-${BUILD_DIR%/Build/*}/SourcePackages}"
          bundle="${resource_path##*/}"
          source="${packages}/checkouts/${resource_path}"
          if [ ! -d "$source" ]; then
            echo "error: Kakao resources not found at $source. For a custom SPM checkout, set KAKAO_SPM_SOURCE_PACKAGES_DIR to -clonedSourcePackagesDirPath."
            exit 1
          fi
          ditto "$source" "${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/${bundle}"
        SH
      end
      resource_targets.keys.map(&:project).uniq.each(&:save)
    end
  end

  def self.dependency(spec, versions, products, resources: [])
    unless respond_to?(:spm_dependency, true)
      raise Pod::Informative, 'React Native Kakao requires React Native 0.76 or newer with Swift Package Manager integration available.'
    end

    versions = Array(versions).uniq
    unless versions.all? { |version| version.is_a?(String) && version.match?(/\A\d+\.\d+\.\d+\z/) }
      raise Pod::Informative, 'Kakao iOS SDK overrides must use an exact version, such as 2.29.0.'
    end
    if versions.length != 1 || (@version && @version != versions.first)
      raise Pod::Informative, "Kakao iOS SDK versions must match across all installed modules. Received #{([@version] + versions).compact.uniq.join(', ')} for #{spec.name}."
    end
    @version = versions.first
    resources.each { |resource| RESOURCE_BUNDLES.fetch(resource) }
    @resources_by_pod ||= {}
    @resources_by_pod[spec.name] = resources
    SPM.singleton_class.prepend(Integration) unless SPM.is_a?(Integration)

    spec.ios.deployment_target = [min_ios_version_supported, '15.0'].max_by { |version| Gem::Version.new(version) }
    spec.pod_target_xcconfig = (spec.attributes_hash['pod_target_xcconfig'] || {}).merge(
      'SWIFT_INCLUDE_PATHS' => '$(inherited) "${SYMROOT}/${CONFIGURATION}${EFFECTIVE_PLATFORM_NAME}/"'
    )
    # Link shared static SDK objects once; every Kakao module already depends on Core.
    core = Pod::Spec.new { |dependency| dependency.name = CORE_NAME }
    spm_dependency(
      core,
      url: 'https://github.com/kakao/kakao-ios-sdk',
      requirement: { kind: 'exactVersion', version: @version },
      products: products
    )
    spm_dependency(
      core,
      url: 'https://github.com/Alamofire/Alamofire.git',
      requirement: { kind: 'upToNextMajorVersion', minimumVersion: '5.9.0' },
      products: ['Alamofire']
    )
  end
end
