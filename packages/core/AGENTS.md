# Core Package Rules

Scope: `/packages/core`

Core is the shared foundation package and also owns Expo config plugin wiring.
Follow `/AGENTS.md` and `/packages/AGENTS.md` first, then apply these core-only rules.

## Core-specific hotspots

- `src/index.ts`, `src/index.web.ts`: shared JS/web utilities exported to other packages.
- `src/spec/NativeKakaoCore.ts`: SDK initialization contract.
- `android/src/main/java/.../RNCKakaoCoreModule.kt`: Android init + key hash behavior.
- `ios/RNCKakaoCore.mm`, `ios/RNCKakaoCoreManager.swift`: iOS bridge + SDK init.
- `expo-config-plugin/src/*`, `app.plugin.js`: Expo prebuild integration points.

## When API changes require plugin changes

Update Expo plugin if your change affects app configuration or runtime integration, for example:

- URL schemes or callback handling
- AppDelegate openURL handling
- Android manifest/intent filter behavior

Relevant files:

- `expo-config-plugin/src/withIos.ts`
- `expo-config-plugin/src/withAndroid.ts`
- `expo-config-plugin/src/index.ts`
- `app.plugin.js`

## Bridge implementation rules

- Keep `RNCKakaoCore` module ID consistent across TS/Android/iOS.
- Keep `.mm` thin and delegate to `RNCKakaoCoreManager.swift`.
- Keep old/new architecture compatibility split untouched.
- Keep web behavior explicit in `index.web.ts` (no hidden fallback).

## Shared utility stability

`@react-native-kakao/core` exports utility functions used by other packages.
When changing these, check impact on:

- `kRunWebAPI`
- `kCreateWebError`
- `kGlobalStorage`
- `kFetch`, `kFetchFormUrlEncoded`

Treat utility API changes as cross-package breaking risk.

## Required verification for core changes

1. `yarn lint`
2. `yarn typecheck`
3. `yarn codegen`
4. Regenerate example native projects if plugin/config changed:
   - `yarn gen:android`
   - `yarn gen:ios`
5. Verify example app build path via `/example/AGENTS.md`
