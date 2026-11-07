# Example App Verification Gates

Scope: `/example`

Use this app as the integration gate for native-module changes.
A package API change is not complete until example verification passes.

## Why this matters

- Expo Autolinking resolves the Kakao service modules and independent map Expo Module declared in `example/package.json`.
- Prebuild-generated Android/iOS projects reflect real integration behavior.
- The app uses the New Architecture required by Expo.

## Required checks after native API changes

1. Regenerate codegen from repo root:
   - `yarn codegen`
2. Generate example native projects without installing dependencies:
   - `yarn gen:android`
   - `yarn gen:ios`
3. Install iOS pods once when the generated iOS project or native dependencies changed:
   - `yarn example pod`
4. Build and test the paths used in CI:
   - `yarn e2e build android`
   - `yarn e2e build ios`
   - `yarn e2e test <platform> --device <device-id>`

## If plugin/config was touched

When `packages/core/expo-config-plugin/*` or app plugin behavior changes:

- regenerate both native projects without installing dependencies
- verify generated native config changes are reflected
- run `yarn example pod` once when iOS output changed

## Fast smoke checklist

- App launches with the New Architecture.
- Updated API method is callable from JS in example.
- iOS and Android both return expected payload shape.
- Web fallback behavior remains compatible when applicable.

## React Native version coverage

- The main example uses React Native 0.88 and Expo SDK 58. CI additionally runs `node script/ci-minimum-rn.ts <android|ios>` to build all packed native modules in an isolated React Native 0.76.0 consumer with the New Architecture; this minimum-version check does not launch a device or run E2E.
- The root TypeScript configuration selects React Native's legacy type exports so published Codegen declarations remain compatible with React Native 0.76, which predates the root `CodegenTypes` namespace. Do not raise the public package minimum when updating the example.
- `node script/ci-minimum-expo.ts <android|ios>` additionally packs Expo modules into an isolated Expo 52 / React Native 0.76.0 consumer and builds each platform.

## E2E runner

- `yarn e2e test [ios|android|both] [--device <device-id>]` runs deterministic TypeScript tests with `e2e`, `@e2e-dev/mobile`, and `agent-device`; no model credentials are needed.
- Omitting the platform runs iOS and Android in parallel. Omitting `--device` lets the mobile SDK select a free booted device or boot one when none are running. Use `--device` or `--app` with a single platform; `--output` for both platforms creates separate `ios/` and `android/` result directories.
- Use a dedicated signed-out simulator or emulator without KakaoTalk or Kakao Navi. Tests do not clear user data or the simulator keychain.
- The suite installs the example once per worker and launches a fresh app process before each scenario. It loads each package screen and covers KakaoTalk availability, signed-out APIs, channel URL generation, and navigation when Kakao Navi is absent. Related API checks share a screen visit. Login, message delivery, certification signatures, and external app actions are excluded.
- Map scenarios run on iOS and ARM Android. The x86_64 Android CI sets `KAKAO_E2E_SKIP_MAP=1`, because the map SDK has no x86_64 binary. Map SDK initialization happens only on the map screen; existing service screens do not initialize it.
- Two map scenarios cover camera commands and props, fresh camera queries, gesture/click events, background recovery, and navigation re-entry. The main map screen keeps camera query, movement, and prop controls; its Feature lab link replaces that screen to avoid simultaneous map engines.
- The separate `/map-features` screen groups individual map settings and commands for direct device verification. Keep its diagnostic text areas and controls at fixed heights so event output cannot resize the map or interrupt camera animations. Derive availability controls, such as language choices, from actual SDK capabilities.
- Camera assertions read a new `getCamera()` response; command and event sequence numbers prevent stale results from passing. Map readiness/authentication errors fail the suite; quota failures must not be reported as successful map verification. Actual tile imagery and an unobscured Kakao logo still require visual inspection on both platforms.
- `--app` selects the Release binary and `--output` selects a new result directory. Recordings and explicit screenshots are disabled.
- The SDK manages device boot, automation preparation, transitions, assertion polling, and test session cleanup. Each run uses its own agent-device state directory under its output and stops that daemon afterward. Passing requires every discovered test to pass. Each output directory is single-use.
- CI prepares iOS automation with `agent-device prepare ios-runner --timeout 600000` under `<KAKAO_E2E_SESSION>-0`, the mobile SDK worker's own session, before starting tests. This waits for both first boot and runner preparation; the engine's `launchTimeout` does not override its boot request's timeout. CI also stops the daemon when preparation fails.
- CI starts the selected Xcode's Simulator app before SDK preparation so the first GUI launch is not constrained by the SDK's 10000 ms show timeout.
- Android CI installs the emulator's audio and X11 runtime libraries, runs its window on an Xvfb display, and stops that display after the emulator runner finishes.
- Evidence includes `summary.json`, `index.html`, `junit.xml`, SDK reports and failure traces under `sdk/`, and automation diagnostics under `agent-device/`. CI updates platform results in a dedicated block in the PR body and preserves the rest of the description.
