# Package-Level Native Module Flow

Use this guide for common work across `packages/{core,share,user,social,channel,navi}`.
This file defines the default implementation order and parity checks.

## Scope

- Add or change native-module APIs exposed to JS.
- Keep Android, iOS, and web behavior aligned unless a platform limitation is explicit.
- Support React Native 0.76.0 or newer with the New Architecture enabled.

## Canonical package skeleton

Each module should keep this baseline shape:

- `src/spec/NativeKakaoX.ts`
- `src/index.ts`
- `src/index.web.ts`
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
4. Update the Android module implementation against the generated spec.
5. Update iOS `.mm` exports and Swift manager logic.
6. Regenerate codegen.
7. Verify example integration.

## Required invariants

- **Module ID parity**: `RNCKakaoX` must match across the TS spec, generated Android spec `NAME`, and iOS exports.
- **Method parity**: every method in TS spec must exist in Android/iOS exports.
- **Type parity**: nullable/optional fields must be mapped consistently across TS/Kotlin/Swift.
- **Result-shape parity**: keys and nesting must match native/web outputs.
- **Runtime loader parity**: import the TurboModule directly from `src/spec/NativeKakaoX.ts`.

## Android checklist

- Keep `BaseReactPackage` registration and `ReactModuleInfoProvider` wiring.
- Extend the generated `NativeKakao*Spec` directly and use its generated module `NAME`.
- Let the React Native Gradle plugin own Codegen tasks and generated source wiring.

## iOS checklist

- Implement the generated spec without legacy architecture conditionals.
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
- New Architecture example build and E2E paths

## Which local guide to read next

- Core-specific plugin/config behavior: `/packages/core/AGENTS.md`
- Share hotspot and template flow: `/packages/share/AGENTS.md`
- User hotspot and auth flow: `/packages/user/AGENTS.md`
- Integration gates in example app: `/example/AGENTS.md`
