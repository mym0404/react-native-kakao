# Example App Verification Gates

Scope: `/example`

Use this app as the integration gate for native-module changes.
A package API change is not complete until example verification passes.

## Why this matters

- Example uses workspace packages via `example/react-native.config.js`.
- Prebuild-generated Android/iOS projects reflect real integration behavior.
- Architecture toggling (`old`/`new`) is controlled from root scripts.

## Required checks after native API changes

1. Regenerate codegen from repo root:
   - `yarn codegen`
2. Ensure example native projects are generated:
   - `yarn gen:android`
   - `yarn gen:ios`
3. Run architecture conversion for the target path:
   - `yarn old` or `yarn new`
4. Build paths used in CI should remain green:
   - Android: `yarn ci:android:build:old` and/or `yarn ci:android:build:new`
   - iOS: `yarn ci:ios:build:new`

## If plugin/config was touched

When `packages/core/expo-config-plugin/*` or app plugin behavior changes:

- re-run prebuild for both platforms
- verify generated native config changes are reflected
- re-check iOS pod install path when required (`yarn old:pod` / `yarn new:pod`)

## Fast smoke checklist

- App launches in target architecture.
- Updated API method is callable from JS in example.
- iOS and Android both return expected payload shape.
- Web fallback behavior remains compatible when applicable.
