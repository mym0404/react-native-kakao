# Native Modules Contributor Playbook

This repository is a monorepo of React Native native modules.
Use this file as the global source of truth for adding or changing native APIs.

## Communication

Assistant responses have no language restriction. Use English for commit messages, PR titles and descriptions, issue discussions, review comments, documentation, and automated reports.

## Guide hierarchy

Read in this order:

1. `/AGENTS.md` (global gates and non-negotiables)
2. `/packages/AGENTS.md` (common package-level execution flow)
3. Package-specific guides when needed:
   - `/packages/core/AGENTS.md`
   - `/packages/share/AGENTS.md`
   - `/packages/user/AGENTS.md`
4. `/example/AGENTS.md` (integration verification gates)

## Development toolchain

- Use mise for all repository-managed development tools.
- Treat `/mise.toml` as the single source of truth for Node.js, Yarn, and native lint tool versions.
- Install and activate mise, then run `mise install` from the repository root before installing dependencies.
- Run `yarn install --immutable` after mise installs the pinned toolchain.
- Do not use Corepack, `.nvmrc`, or other version files to manage repository tool versions.

## Changesets

- For changes to published packages, use `yarn changeset` to add a `.changeset/*.md` file listing the affected package names, version bump type, and a short English description of the changes.
- Documentation and tooling-only changes do not require a changeset.

## Global non-negotiables

- Define the API in TypeScript spec first, then implement Android + iOS + web parity.
- Support React Native 0.76.0 or newer with the New Architecture enabled.
- Do not rename native module IDs casually. Keep `TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoX')` aligned with native registration names.
- Keep `.mm` thin and delegate platform logic to Swift manager classes.
- Import the generated TurboModule contract directly from `src/spec/NativeKakao*.ts` in `index.ts`.
- If `src/spec` changes, regenerate codegen artifacts before finishing.

## Cross-platform API change sequence

1. Update `packages/<module>/src/spec/NativeKakao*.ts`
2. Update `packages/<module>/src/index.ts`
3. Update `packages/<module>/src/index.web.ts`
4. Update Android:
   - `android/src/main/java/.../RNCKakao*Module.kt` (extend the generated spec directly)
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

- Keep package registration through `BaseReactPackage` and `ReactModuleInfoProvider`.
- Extend the generated `NativeKakao*Spec` directly and use its generated module `NAME`.
- Let the React Native Gradle plugin own Codegen tasks and generated source wiring; do not add manual Codegen source sets.

## iOS rules

- Implement the generated `NativeKakao*Spec` without legacy architecture conditionals.
- Keep C++ bridge headers private to the pod so Swift imports do not parse generated C++ specs.
- Keep `getTurboModule:` returning `NativeKakao*SpecJSI`.
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
- Native integration gates use the build and E2E paths in `.github/workflows/ci.yml`.
- Example app must compile and load every module with the New Architecture.

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
