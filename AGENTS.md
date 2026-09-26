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

## Changesets and releases

- Read the Changesets and release sections in `/CONTRIBUTING.md` before preparing a release, backport, or promotion.
- Add a changeset with `yarn changeset` for changes to published package behavior, APIs, or package contents. Select the affected packages and describe the user-visible change in English.
- Use `patch` for compatible fixes and `minor` for compatible features. Breaking changes require a maintainer decision about the next major version; both active release branches currently target v2.
- Documentation, tests, and tooling-only changes do not require a release changeset. Do not bump a package solely to test release automation.
- Keep the six public packages in one fixed version group. Let the generated version PR update package versions and changelogs; do not edit them manually in ordinary change PRs.
- Target `main` for development and `2.x.x-next.N` prereleases published to npm's `next` tag. Target `v2` for stable `2.x.x` releases and backports published to `latest`. The old `next` branch is not a release target.
- Keep `baseBranch` omitted from `.changeset/config.json`. Use `yarn changeset status --since main` or `--since v2` for comparisons against the intended PR target.
- For backports, carry only the required code changes and add a fresh changeset for `v2`; exclude version commits and prerelease state.
- For stable promotion, run `yarn changeset pre exit` on a promotion branch targeting `v2`. After publication, synchronize the stable version PR's metadata into `main` and start the next cycle with `yarn changeset pre enter next`, preserving unrelated development and pending changesets.
- `.github/workflows/release.yml` runs independently of CI on `main` and `v2` pushes: pending changesets produce a version PR, and merging that PR publishes the packages. Do not enable automatic merging of version PRs or publish manually unless explicitly requested.
- Preserve npm Trusted Publishing and the dedicated `CHANGESETS_TOKEN` used to create version PRs.
- Create one Git tag and GitHub Release per shared version, such as `2.4.8` or `2.4.9-next.0`, without a `v` prefix. Keep package-specific tag and Release generation disabled. Mark prereleases as prerelease/non-latest and stable releases as latest.
- Preserve historical version tags and Releases, including legacy `v`-prefixed ones. When package-specific cleanup is requested, target only the matching `@react-native-kakao/<package>@<version>` entries.
- Review Release notes against that version's changelog entries; exclude unrelated historical changes and unnecessary user mentions.
- Verify publication using npm dist-tags for all six packages and verify the Git tag's target commit and GitHub Release flags. A successful workflow alone is not proof of registry publication.
- If npm publication succeeded but Release creation failed, manually rerun the Release workflow on the same branch while it still contains the matching release version and mode. Already published npm versions are skipped.

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
