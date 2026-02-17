# Package-Level Native Module Flow

Use this guide for common work across `packages/{core,share,user,social,channel,navi}`.
This file defines the default implementation order and parity checks.

## Scope

- Add or change native-module APIs exposed to JS.
- Keep Android, iOS, and web behavior aligned unless a platform limitation is explicit.
- Keep both old/new architecture support unless policy says otherwise.

## Canonical package skeleton

Each module should keep this baseline shape:

- `src/spec/NativeKakaoX.ts`
- `src/index.ts`
- `src/index.web.ts`
- `android/src/oldarch/*Spec.kt`
- `android/src/newarch/*Spec.kt`
- `android/src/main/java/.../RNCKakaoXModule.kt`
- `android/src/main/java/.../RNCKakaoXPackage.kt`
- `android/build.gradle`
- `ios/RNCKakaoX.h`
- `ios/RNCKakaoX.mm`
- `ios/RNCKakaoXManager.swift`
- `RNCKakaoX.podspec`
- `package.json` (`codegenConfig`)

## Default API change workflow

1. Update TS contract in `src/spec/NativeKakaoX.ts`.
2. Update JS wrapper in `src/index.ts`.
3. Update web implementation in `src/index.web.ts`.
4. Update Android old/new specs and module implementation.
5. Update iOS `.mm` exports and Swift manager logic.
6. Regenerate codegen.
7. Verify example integration.

## Required invariants

- **Module ID parity**: `RNCKakaoX` must match across spec, Android module `NAME`, and iOS exports.
- **Method parity**: every method in TS spec must exist in Android/iOS exports.
- **Type parity**: nullable/optional fields must be mapped consistently across TS/Kotlin/Swift.
- **Result-shape parity**: keys and nesting must match native/web outputs.
- **Runtime loader parity**: keep `index.ts` Turbo fallback pattern unchanged.

## Android checklist

- Keep `TurboReactPackage` registration and `ReactModuleInfoProvider` wiring.
- Keep `BuildConfig.IS_NEW_ARCHITECTURE_ENABLED` based turbo flag.
- Preserve source set split:
  - `src/newarch`
  - `src/oldarch`
  - generated codegen java path

## iOS checklist

- Keep `#ifdef RCT_NEW_ARCH_ENABLED` split in `.h` and `.mm`.
- Keep `getTurboModule:` returning `NativeKakao*SpecJSI`.
- Keep `.mm` as bridge forwarding layer; put SDK logic in Swift manager.
- Keep Swift header include compatibility pattern intact.

## Codegen checklist

- `package.json` `codegenConfig` must stay aligned with module naming.
- Run from root:
  - `yarn codegen:android`
  - `yarn codegen:ios`
  - `yarn codegen`

## Validation checklist

- `yarn lint`
- `yarn typecheck`
- example build path for target architecture (`old` and/or `new`)

## Which local guide to read next

- Core-specific plugin/config behavior: `/packages/core/AGENTS.md`
- Share hotspot and template flow: `/packages/share/AGENTS.md`
- User hotspot and auth flow: `/packages/user/AGENTS.md`
- Integration gates in example app: `/example/AGENTS.md`
