# Contributing

Please follow it in all your interactions with the project. Before contributing, please read
the [code of conduct](./CODE_OF_CONDUCT.md).

## Scripts Table

The `package.json` file contains various scripts for common tasks:

**Installiation, Build**

- `yarn`: setup project by installing dependencies.
- `yarn build`: build packages

**Validation**

- `yarn lint`: lint files with ESLint, ClangFormat, SwiftFormat, Ktlint, TypeScript
- `yarn t`: alias for lint
- `yarn test`: run unit tests with Jest
- `yarn format:ios`: run formatter with ClangFormat, SwiftFormat for iOS codes
- `yarn format:android`: run formatter with Ktlint for Android codes

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

To get started with the project, run `yarn` in the root directory to install the required
dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli)
> for development.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any
changes you make.

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
yarn typecheck
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

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
[ClangFormat](https://clang.llvm.org/docs/ClangFormat.html), [SwiftFormat](https://github.com/apple/swift-format), [Ktlint](https://pinterest.github.io/ktlint/latest/install/setup/)

We use [TypeScript](https://www.typescriptlang.org/) for type
checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and
formatting the code, and [Jest](https://jestjs.io/) for testing.

In iOS project, we
use [ClangFormat](https://clang.llvm.org/docs/ClangFormat.html), [SwiftFormat](https://github.com/apple/swift-format)
for formatting and linting.

In Android project, we use [Ktlint](https://pinterest.github.io/ktlint/latest/install/setup/) for
formatting and linting.

Our pre-commit hooks verify that the linter and tests pass when committing.

### Documentation

[Our documentation](https://rnkakao.dev) is built
with [Docusaurus](https://docusaurus.io/) and is just maintained with
**Korean**.

If your API changes require changes to the documentation, you should include those changes in the
documentation as well.

If you are not a Korean speaker, you may indicate so in your PR content. We will update the
documentation as changes occur.

### Sending a pull request

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening
  an issue.
