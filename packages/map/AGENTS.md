# Kakao Map Expo Module

Scope: `packages/map`. Read the root guide first. The service-module skeleton in `packages/AGENTS.md` does not apply to this Expo Module.

- Own the public contract in `src/types.ts`; keep Swift, Kotlin, events, and ref methods aligned.
- Use Expo Modules registration and native views. Do not add TurboModule specs, Codegen configuration, React packages, or ObjC++ bridges.
- Use Expo Promise, coded exceptions, and main-queue functions. Do not depend on `@react-native-kakao/core`.
- Initialize the map SDK explicitly before mounting a view. Initialization does not mean authentication or map readiness.
- Each mounted view owns its map engine. Pause when detached/inactive, resume when attached/active, and release observers, listeners, and engine resources on destruction.
- Public angles are degrees; SDK angles are radians. Verify rotation direction and camera round trips on both platforms.
- Camera props trigger movement only when their values change. Initial camera is consumed once. Ref movement resolves when dispatched, not when animation ends.
- Web imports must remain safe; invoking the map on web must report unsupported platform explicitly.
- Android SDK supports ARM only. Skip map runtime scenarios explicitly on x86_64 CI; do not skip other packages' scenarios.
- Verify actual tiles and the visible Kakao logo on local ARM Android and iOS, plus map events, camera movement, navigation re-entry, and background restoration.
- Preserve RN 0.76 / Expo 52 minimum support with `script/ci-minimum-expo.ts` builds in addition to current example builds. Map does not participate in React Native Codegen.
