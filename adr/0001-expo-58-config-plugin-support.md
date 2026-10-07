# ADR 0001: Support Expo 58 through the existing AppDelegate integration

- Date: 2026-10-08
- Status at creation: Accepted
- Decision makers: Not recorded
- Scope: `@react-native-kakao/core` iOS Expo config plugin and KakaoTalk login URL handling
- Supersedes: None
- Superseded by: See the [supersession log](README.md#supersession-log)

## Context

Expo SDK 58 beta uses a scene-based lifecycle, and its Swift AppDelegate template omits `application(_:open:options:)`. The existing plugin could add the Kakao import without adding a callback, so the return URL from KakaoTalk could go unhandled. Expo forwards scene URL events to AppDelegate, so both lifecycles can use the same callback.

Open [PR #126](https://github.com/mym0404/react-native-kakao/pull/126) implements this approach at commit `7651cd54acce093d09300f8f927bca581e2fee2a`. The design is accepted; the PR has not been merged.

## Alternatives

- Patch only existing callbacks: the SDK 58 template has no callback to patch, so it still has no Kakao handler.
- Add a separate SceneDelegate integration: duplicates Expo's URL forwarding and requires separate code for each lifecycle.
- Extend the existing AppDelegate integration (chosen): handles both templates with the same plugin configuration.

## Decision

- Keep `ios.handleKakaoOpenUrl` as the opt-in setting for URL handling. Leave AppDelegate unchanged when it is disabled.
- Match the generated AppDelegate's contents, without checking the Expo SDK version. Keep existing Swift and Objective-C/Objective-C++ callbacks and unrelated overloads; add the Kakao handler to the URL callback.
- Generate the override when Swift has no URL callback. Handle Kakao login URLs through `RNCKakaoUserUtil` and keep Expo/React Native forwarding for other URLs. Repeated prebuilds must not duplicate imports or handlers.
- Use Expo's scene activation and lifecycle forwarding. The plugin does not enable scenes or replace SceneDelegate. Apps with a custom SceneDelegate must forward URL events to AppDelegate. SDK 57.0.23 and newer can opt into scenes through `expo-build-properties`' `ios.enableSceneSupport`; SDK 58 beta uses scenes by default.
- The app chooses its callback routes. Expo also emits Kakao callback URLs through JavaScript Linking; Expo Router apps must map them to an existing route with `redirectSystemPath` in `+native-intent.tsx` to avoid `Unmatched Route`.

## Consequences

Apps use the same Kakao plugin configuration with AppDelegate and scene lifecycles, including templates with existing callbacks. This relies on Expo forwarding scene events to AppDelegate. App authors must provide any custom scene forwarding and choose Router destinations, since the plugin cannot choose an application's navigation target.

## Verification

- ✅ PR #126 reports plugin execution and repeated-prebuild checks on SDK 52/53/57/58, plus Debug/Release builds with Expo 58.0.6 beta and React Native 0.88.0-rc.3. Its scene fixtures delivered URLs while the app was running and after a cold start. Fake Kakao callbacks sent to the running app invoked the native handler once and emitted one JavaScript URL event. These results come from the PR; the tests were not rerun for this ADR.
- ⚠️ At inspection, [CI run 37651489492](https://github.com/mym0404/react-native-kakao/actions/runs/37651489492) for the recorded commit had passed the lint job, including package builds, but native build jobs were still in progress. Final native CI completion was not verified.
- ⚠️ Invalid callback fixtures show that the URL arrives and the native handler runs. They do not verify authenticated KakaoTalk login or recovery of a pending login Promise after process termination.

## References

- [PR #126](https://github.com/mym0404/react-native-kakao/pull/126)
- [Plugin implementation at the recorded commit](https://github.com/mym0404/react-native-kakao/blob/7651cd54acce093d09300f8f927bca581e2fee2a/packages/core/expo-config-plugin/src/withIos.ts)
- [Expo scene lifecycle guide](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md)
- [Expo Router native intent guide](https://docs.expo.dev/router/advanced/native-intent/)
