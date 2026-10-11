# Example App Verification Gates

Scope: `/example`

Use this app as the integration gate for native-module changes.
A package API change is not complete until example verification passes.

## Why this matters

- Expo Autolinking resolves the six Kakao workspace packages declared in `example/package.json`.
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

## E2E runner

- `yarn e2e test [ios|android|both] [--device <device-id>]` runs deterministic TypeScript tests with `e2e`, `@e2e-dev/mobile`, and `agent-device`; no model credentials are needed.
- Omitting the platform runs iOS and Android in parallel. Omitting `--device` selects the first mobile device returned by agent-device for each platform and boots it if needed. Use `--device` or `--app` with a single platform; `--output` for both platforms creates separate `ios/` and `android/` result directories.
- Use a dedicated signed-out simulator or emulator without KakaoTalk or Kakao Navi. Tests do not clear user data or the simulator keychain.
- The suite covers six menu screens, KakaoTalk availability, signed-out state, user/social token errors, channel URL generation, and navigation when Kakao Navi is absent. Login, message delivery, and external app actions are excluded.
- `--app` selects the Release binary, `--output` selects a new result directory, and `--video` records the entire platform test run as one `video.mp4`; per-test recordings and explicit screenshots are disabled.
- The SDK manages agent-device startup and test session cleanup. Passing requires every discovered test to pass and, when requested, the whole-run video to exist. Each output directory is single-use.
- Evidence includes `summary.json`, `index.html`, `junit.xml`, the whole-run video, and SDK reports under `sdk/`. CI attaches whole-run videos to a marked section of the PR body.
