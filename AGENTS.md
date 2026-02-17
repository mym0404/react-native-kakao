# Native Modules Contributor Playbook

This repository is a monorepo of React Native native modules.
Use this file as the global source of truth for adding or changing native APIs.

## Guide hierarchy

Read in this order:

1. `/AGENTS.md` (global gates and non-negotiables)
2. `/packages/AGENTS.md` (common package-level execution flow)
3. Package-specific guides when needed:
   - `/packages/core/AGENTS.md`
   - `/packages/share/AGENTS.md`
   - `/packages/user/AGENTS.md`
4. `/example/AGENTS.md` (integration verification gates)

## Global non-negotiables

- Define the API in TypeScript spec first, then implement Android + iOS + web parity.
- Keep dual-architecture compatibility (`android/src/newarch` and `android/src/oldarch`) unless there is explicit policy to drop legacy support.
- Do not rename native module IDs casually. Keep `TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoX')` aligned with native registration names.
- Keep `.mm` thin and delegate platform logic to Swift manager classes.
- Keep `index.ts` runtime loading shape unchanged:
  - `global.__turboModuleProxy` check
  - `require('./spec/Native...').default` for Turbo
  - `NativeModules.RNCKakaoX` fallback for old architecture
  - `LINKING_ERROR` proxy for unlinked state
- If `src/spec` changes, regenerate codegen artifacts before finishing.

## Cross-platform API change sequence

1. Update `packages/<module>/src/spec/NativeKakao*.ts`
2. Update `packages/<module>/src/index.ts`
3. Update `packages/<module>/src/index.web.ts`
4. Update Android:
   - `android/src/oldarch/*Spec.kt`
   - `android/src/newarch/*Spec.kt` (usually inheritance shell, keep aligned)
   - `android/src/main/java/.../RNCKakao*Module.kt`
5. Update iOS:
   - `ios/RNCKakao*.h`
   - `ios/RNCKakao*.mm`
   - `ios/RNCKakao*Manager.swift`
6. Validate in example app flows (`/example/AGENTS.md`)

## Method parity rules

- TS spec method list is the contract. Android/iOS exports must match one-to-one.
- Keep optional/nullability behavior consistent across TS/Kotlin/Swift/ObjC++.
- Keep return shape parity across native and web (key names, array/object structure).
- For async flows, use Promise-based signatures and explicit error propagation.

## Android rules

- Keep package registration through `TurboReactPackage` and `ReactModuleInfoProvider`.
- `BuildConfig.IS_NEW_ARCHITECTURE_ENABLED` drives TurboModule flags.
- Keep Gradle new-arch source set wiring intact:
  - `src/newarch`
  - `${project.buildDir}/generated/source/codegen/java`
- Do not remove `src/oldarch` support unless policy explicitly changes.

## iOS rules

- Keep `#ifdef RCT_NEW_ARCH_ENABLED` split in headers and `.mm` implementations.
- Keep `getTurboModule:` returning `NativeKakao*SpecJSI` in new architecture builds.
- Use Swift manager for SDK calls, threading, and result mapping.
- Preserve Swift header compatibility imports:
  - `#if __has_include("RNCKakaoX-Swift.h")`
  - fallback framework import path

## Codegen and config rules

- `codegenConfig` in each package must stay aligned with module naming:
  - `name`
  - `type: "modules"`
  - `jsSrcsDir: "src"`
  - `android.javaPackageName`
- Regenerate from repo root when spec changes:
  - `yarn codegen:android`
  - `yarn codegen:ios`
  - `yarn codegen`

## Verification gates

- Type/format/lint gates (hook + CI aligned):
  - `yarn lint`
  - `yarn typecheck`
- Native integration gates:
  - build/test paths in `.github/workflows/ci.yml`
  - architecture conversion via `script/arch-convert.sh`
- Example app must still compile in the target architecture(s).

## When to add a new local AGENTS.md

Add a package-local guide when either condition is true:

- The package has package-specific bridge rules that are not generic.
- Contributors repeatedly miss the same package-specific parity or integration checks.

Current hotspots are already covered by local guides (`core`, `share`, `user`).

## References

- React Native Turbo Native Modules overview: https://reactnative.dev/docs/turbo-native-modules-introduction
- Android TurboModules: https://reactnative.dev/docs/turbo-native-modules-android
- iOS TurboModules: https://reactnative.dev/docs/turbo-native-modules-ios
- Codegen in new architecture: https://reactnative.dev/docs/the-new-architecture/using-codegen
- Swift TurboModule integration: https://reactnative.dev/docs/the-new-architecture/turbo-modules-with-swift
