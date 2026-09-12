# Example app E2E verification

Run `script/e2e.ts` with Bun and ZX to verify the example app using agent-device.
The root `mise.toml` pins both Bun and agent-device.

The flow is Home → User → Home → Share → Home → Navi → Home → Social → Home → Channel.
It checks each screen title and captures six screenshots, including Home.
It does not log in, execute feature actions, or compare pixels against baseline images.

## Local execution

Prepare the tools and dependencies from the repository root:

```sh
mise install
mise exec -- yarn install --immutable
mise exec -- yarn build
mise exec -- yarn new
mise exec -- yarn example pod:new
```

Android requires the Android SDK and JDK; iOS requires Xcode and an iOS Simulator.
Boot the emulator or simulator you want to use, then find its ID:

```sh
adb devices
xcrun simctl list devices booted
```

Build the Release app with the new architecture. The default Android ABI follows the host CPU.
Use `--abi arm64-v8a` or `--abi x86_64` when the emulator uses a different ABI.

```sh
mise exec -- yarn e2e build android
mise exec -- yarn e2e build ios
```

Replace the example IDs below with your device IDs. These commands install and test the app without rebuilding it:

```sh
mise exec -- yarn e2e test android --device emulator-5554
mise exec -- yarn e2e test ios --device SIMULATOR_UDID
```

Each run writes to `build/e2e/<platform>/<timestamp>/`.
Open `index.html` to view all six screens together.
Rebuild the corresponding platform whenever app code changes.

## Options and artifacts

| Option          | Behavior                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------ |
| `--app PATH`    | Install an existing APK or Simulator `.app`. Use a Release build with the new architecture |
| `--output PATH` | Use a specific output directory. Refuse to overwrite a previous run containing `run.json`  |
| `--video`       | Record the same navigation flow to an MP4 under `native/`                                  |
| `--help`        | Print command usage                                                                        |

The output contains six PNGs, JUnit, installation and test logs, the generated `.ad` flow, `summary.json`, and `index.html`.
agent-device also stores screenshot copies and per-step logs under `native/`.
Android waits for three successful package-service checks before installation, with a three-minute limit.
This covers cold emulators that restart framework services after reporting boot completion.
iOS prepares and health-checks the XCTest runner before testing, with a ten-minute startup limit.
Preparation is logged in `prepare.log`; iOS daemon diagnostics are saved in `device-state/`.
Build logs are written to `build/e2e/<platform>/build.log`.
A failed navigation step or missing PNG produces exit code 1. Automatic retries are disabled.
The first Home check allows 60 seconds for cold device helper startup. Later checks use the default timeout.
On failure, the script also attempts to save `failure.png` using the native device tool.
Android failures also save the latest 1,000 logcat entries to `logcat.log`.
Reported test time excludes app installation, device preparation, and builds; enabling video includes recording time.
`summary.json` records installation and preparation times separately.

## GitHub CI and PR comments

The existing `build-android (new)` and `build-ios (new)` jobs build Release apps and run the same script.
Android uses the Medium Phone profile with API 37.1, a 16 KB Google Play image, 4 GB RAM, and software graphics rendering on Ubuntu.
The local PoC uses the ARM64 image; CI uses x86_64. iOS uses an iPhone 17 Pro Simulator with Xcode 26.2.
The Android old-architecture build and existing required check names remain in place.
A cached build-success result never skips E2E execution. Gradle and Pods dependency caches are reused.

The workflow uploads output directories as GitHub Actions artifacts on success or failure and retains them for 14 days.
For same-repository PRs, it updates one comment with each platform's result, test time, screenshot count, and download link.
If a build or simulator boot fails before the script starts, the comment reports `Not run`.
Results from an older commit do not overwrite the latest PR comment.

Fork PRs also run builds and E2E tests and upload artifacts.
Their read-only token cannot write PR comments, so the comment job is skipped.
Download the artifact ZIP and open `index.html` to inspect the screenshots.
