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
- `yarn gen:android`: prebuild android expo directory
- `yarn gen:android:clean`: clean and prebuild android expo directory
- `yarn gen:ios`: prebuild ios expo directory
- `yarn gen:ios:clean`: clean and prebuild ios expo directory

**Util**

- `yarn studio`: open Android Studio in example/android
- `yarn xcode`: open Xcode in example/ios

**Architecture Convert**

- `new`: convert example project to new architecture
- `old`: convert example project to old architecture
- `new:pod`: convert example project to new architecture with pod install
- `old:pod`: convert example project to old architecture with pod install
- `old:clean`: convert example project to old architecture with clean project, pod install
- `new:clean`: convert example project to old architecture with clean project, pod install

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
> Our example app uses Expo. You should generate iOS and Android projects for development or building.
>
> Please take a look at the scripts for handling Expo project generation and building.
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

If you are building for a different architecture than your previous build, make sure to remove the
build folders first. You can run the following command to cleanup all build folders:

```sh
yarn gen:clean
```

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
- Breaking changes require a maintainer decision about the next major-version policy. Do not add a
  `major` changeset while `main` and `v2` both remain on major version 2.

All six published packages use fixed versioning, so each release gives them the same version even
when a changeset selects only the packages directly affected.

Documentation, tests, and tooling-only changes do not need a package release. You may add an empty
changeset with `yarn changeset --empty` when you want the pull request to record that decision.
Contributors must not run `yarn release`, `yarn npm publish`, or publish packages manually.

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
formatting the code, and [Jest](https://jestjs.io/) for testing.

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

`v2` is the stable 2.x branch and publishes to npm's `latest` tag. `main` is the 2.x prerelease
branch and publishes versions such as `2.4.8-next.0` to the `next` tag. Normal development targets
`main`.

The release workflow starts on pushes to either release branch and does not wait for CI. It creates
or updates a version pull request when changesets are pending. The version pull request is never
merged automatically; merging it triggers the automated npm publication for that branch and tag.

The version pull request uses a dedicated `CHANGESETS_TOKEN` with repository contents and
pull-request write access. npm publication uses Trusted Publishing instead of that token.

The old `next` branch is retired from development but remains available for history.

#### Backport a fix to v2

Keep the stable backport separate from normal `main` development:

```sh
git switch v2
git pull --ff-only
git switch -c fix/v2-<topic>
git cherry-pick <code-commit-from-main>
yarn changeset
```

Cherry-pick only the code commit. Add a fresh changeset on the backport branch, then open its pull
request against `v2`. Do not cherry-pick version commits, `.changeset/pre.json`, consumed changeset
files, or other prerelease state from `main`.

#### Promote a main prerelease to stable

Before promotion, fetch `v2` and compare its fixed package version with the stable base of the
current `main` prerelease. For example, `2.4.9-next.1` has the stable base `2.4.9`. If `v2` has
already published that version, synchronize the `v2` hotfix release into `main` first:

```sh
git switch main
git pull --ff-only
git switch -c chore/sync-v2-<version>
git fetch origin v2
git cherry-pick <v2-version-pr-commit>
```

Resolve conflicts by setting only the six public package `version` fields to the stable `v2`
version. Retain `main` code, dependency metadata, `.changeset/pre.json`, and every unconsumed
changeset. Combine both changelog histories, then regenerate the lockfile from the resolved
manifests with `yarn install --mode=update-lockfile`; do not take the `v2` package manifests or
lockfile wholesale.

Run `yarn changeset status`. If no real changeset remains, add a patch changeset describing the
unreleased `main` work carried forward after the hotfix. Merge the synchronization pull request
into `main`, then review and merge its generated prerelease version pull request. Confirm that npm
published an unused next version, such as `2.4.10-next.0`, before promotion. Never reuse a stable
version for different package contents.

Create the promotion branch from that up-to-date `main`:

```sh
git switch main
git pull --ff-only
git switch -c release/v2-<version>
yarn changeset pre exit
```

On that branch, set `baseBranch` in `.changeset/config.json` to `v2`, commit the generated Changesets
state, and open the pull request against `v2`. If the pull request conflicts in Changesets files,
resolve them for the `v2` target: keep `"baseBranch": "v2"` and the pre-exit state generated by the
command. Do not delete pending changesets manually.

After the promotion pull request merges, review and merge the generated version pull request on
`v2`. Its merge publishes the stable packages to `latest`.

After publication, create a synchronization branch from `main`. Cherry-pick only the stable version
pull request commit or commits, rather than merging every `v2` commit:

```sh
git switch main
git pull --ff-only
git switch -c chore/sync-v2-<version>
git fetch origin v2
git cherry-pick <stable-version-pr-commit>
```

Resolve conflicts by retaining `main` code and dependency changes, and apply only the generated
package versions, changelogs, and consumed changeset state from the stable release. Keep pending
changesets that the stable release did not consume. Restore `"baseBranch": "main"` in
`.changeset/config.json`, then start a fresh prerelease cycle:

```sh
yarn changeset pre enter next
```

If the stable version pull request has multiple commits, cherry-pick each one in order. Review its
file list before resolving conflicts. The synchronization must exclude unrelated `v2`-only code.
Open this synchronization pull request against `main`.

The current package version is `2.4.7`. The first stable proposal is `2.4.8`, and the first
prerelease proposal is `2.4.8-next.0`.

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
