# Example App Verification Gates

Scope: `/example`

Use this app as the integration gate for native-module changes.
A package API change is not complete until example verification passes.

## Why this matters

- Example uses workspace packages via `example/react-native.config.js`.
- Prebuild-generated Android/iOS projects reflect real integration behavior.
- The app keeps the New Architecture enabled in `app.json`.

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
