# Contributing

Please follow it in all your interactions with the project. Before contributing, please read
the [code of conduct](./CODE_OF_CONDUCT.md).

## Scripts Table

The `package.json` file contains various scripts for common tasks:

**Installation and Build**

- `mise install`: install the project toolchain.
- `yarn install --immutable`: install project dependencies.
- `yarn build`: build packages.

**Release metadata**

- `yarn changeset`: describe a publishable change and select its version bump.
- `yarn release:version`: apply pending changesets and update the lockfile.
- `yarn release`: build and publish the packages. This command is for release automation and maintainers.

**Validation**

- `yarn lint`: lint files with ESLint, ClangFormat, SwiftFormat, Ktlint, TypeScript and verify build success and codegen generation
- `yarn t`: alias for lint
- `yarn format`: run formatter with ClangFormat, SwiftFormat for iOS codes and withKtlint for Android codes

**Example App Build, Manipluations**

- `yarn android`: run the example app on Android
- `yarn ios`: run the example app on iOS
- `yarn dev`: run example app metro server
- `yarn gen:android`: generate the Android Expo directory without installing dependencies
- `yarn gen:ios`: generate the iOS Expo directory without installing dependencies
- `yarn example pod`: install iOS dependencies after generating the iOS project

**Util**

- `yarn studio`: open Android Studio in example/android
- `yarn xcode`: open Xcode in example/ios

**Codegen**

- `yarn codegen`: generate codegen spec for all platform
- `yarn codegen:android`: generate android codegen spec
- `yarn codegen:ios`: generate ios codegen spec

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces).
It contains the following packages:

- The library packages in the `packages/` directory.
- An example app in the `example/` directory.

Install and activate [mise](https://mise.jdx.dev/getting-started.html), then run the following
commands in the project root. The committed `mise.toml` pins Node.js, Yarn, ClangFormat,
SwiftFormat, and Ktlint to the versions used by CI.

```sh
mise install
yarn install --immutable
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli)
> for development. Yarn is managed by mise; do not enable Corepack for this project.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any
changes you make.

> [!IMPORTANT]
> Our example app uses Expo SDK 52 or newer with the New Architecture enabled. Generate iOS and
> Android projects for development or building; Expo Go cannot load these native modules.
>
> `yarn gen:android` and `yarn gen:ios` only generate projects. Run `yarn example pod` once after
> generating iOS when its native output or dependencies changed.
> If you are having trouble building or running the Expo example project, you can run it directly from Android Studio or Xcode after the appropriate setup.

It is configured to use the local version of the library, so any changes you make to the library's
source code will be reflected in the example app. Changes to the library's JavaScript code will be
reflected in the example app without a rebuild, but native code changes will require a rebuild of
the example app.

If you want to use Android Studio or XCode to edit the native code, you can open
the `example/android` or `example/ios` directories respectively in those editors. To edit the
Objective-C or Swift files, run `yarn xcode` and
find the source files at `Pods > Development Pods > RNCKakaoXXX`.

To edit the Java or Kotlin files, run `yarn studio`

You can use various commands from the root directory to work with the project.

To confirm that the app is running with the new architecture, you can check the Metro logs for a
message like this:

```sh
Running "ReactNativeKakaoShareExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
yarn lint
```

### Dependency versions

- Put versions shared by multiple workspaces in the `catalog` in `.yarnrc.yml`, with one common
  version for each dependency.
- Use `workspace:*` for dependencies between this repository's packages, including peer
  dependencies.
- Keep external peer dependencies as explicit semver ranges so consumers can use supported
  versions.

### Changesets

Add a changeset to every pull request that changes a published package's behavior or API:

```sh
yarn changeset
```

Select the affected packages, choose the version bump, and write a concise release note that says
what changes for package users. Do not describe implementation details such as renamed local
variables or CI steps.

```md
---
'@react-native-kakao/user': patch
---

Prevent Kakao login from crashing when the native SDK returns a missing account.
```

- `patch`: a backward-compatible bug fix, for example fixing an Android login crash.
- `minor`: a backward-compatible feature, for example adding a new share method.
- `major`: a breaking change targeting `main`. Keep `v2` backports backward-compatible.

All six published packages use fixed versioning, so each release gives them the same version even
when a changeset selects only the packages directly affected.

Documentation, tests, and tooling-only changes do not need a package release. You may add an empty
changeset with `yarn changeset --empty` when you want the pull request to record that decision.
Contributors must not run `yarn release:version`, `yarn release`, `yarn npm publish`, or publish
packages manually. Release automation applies versions and publishes packages.

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our
commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Linting and tests

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/),
[ClangFormat](https://clang.llvm.org/docs/ClangFormat.html), [SwiftFormat](https://github.com/nicklockwood/SwiftFormat), [Ktlint](https://pinterest.github.io/ktlint/latest/install/setup/)

We use [TypeScript](https://www.typescriptlang.org/) for type
checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and
formatting the code, and the built-in [Node.js test runner](https://nodejs.org/api/test.html) for testing.
Run `yarn test` from the repository root to execute `script/**/*.test.js`. Tests import `test` from
`node:test` and assertions from `node:assert/strict`.

In iOS project, we
use [ClangFormat](https://clang.llvm.org/docs/ClangFormat.html), [SwiftFormat](https://github.com/nicklockwood/SwiftFormat)
for formatting and linting.

In Android project, we use [Ktlint](https://pinterest.github.io/ktlint/latest/install/setup/) for
formatting and linting.

Our pre-commit hooks verify that the linter and tests pass when committing.

### Documentation

[Our documentation](https://rnkakao.mjstudio.net) is built
with [Docusaurus](https://docusaurus.io/) and is just maintained with
**Korean(default) and English**.

If your API changes require changes to the documentation, you should include those changes in the
documentation as well.

### Release branches and automation

`v2` is the stable maintenance branch and publishes to npm's `latest` tag. `main` is the
prerelease branch and publishes to the `next` tag. Normal development targets `main`.

For branch comparisons, use `yarn changeset status --since main` or `--since v2` to match the
pull request's target branch.

The release workflow starts on pushes to either release branch and does not wait for CI. It creates
or updates a version pull request when changesets are pending. The version pull request is never
merged automatically; merging it triggers the automated npm publication for that branch and tag.

After npm publication succeeds, the workflow creates one Git tag and GitHub Release for the shared
version, without a `v` prefix. Releases from `main` are marked as prereleases. Package-specific
Git tags and GitHub Releases are disabled.

If npm publication succeeds but GitHub Release creation fails, manually run the Release workflow
on the same release branch. Already published npm versions are skipped, and the missing GitHub
Release is created. The branch must still contain that release version and its matching release mode.

The version pull request uses a dedicated `CHANGESETS_TOKEN` with repository contents and
pull-request write access. npm publication uses Trusted Publishing instead of that token.

The old `next` branch is retired from development but remains available for history.

#### Backport a fix to v2

Keep the stable backport separate from normal `main` development:

```sh
git switch v2
git pull --ff-only
git switch -c fix/v2-<topic>
git cherry-pick --no-commit <code-commit-from-main>
git restore --source HEAD --staged --worktree .changeset
git commit
yarn changeset
```

Cherry-pick only the code changes. The restore step excludes any original changeset included in the
commit; add a fresh changeset on the backport branch, then open its pull request against `v2`. Do
not cherry-pick version commits, `.changeset/pre.json`, consumed changeset files, or other
prerelease state from `main`.

### Sending a pull request

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Add a meaningful changeset for published package changes, or identify the change as
  documentation, tests, or tooling only.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening
  an issue.
