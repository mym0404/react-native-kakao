# Kakao Map Expo Module

Scope: `packages/map`. Read the root guide first. The service-module skeleton in `packages/AGENTS.md` does not apply to this Expo Module.

- Own the public contract in `src/types.ts`; keep Swift, Kotlin, events, and ref methods aligned.
- Use Expo Modules registration and native views. Do not add TurboModule specs, Codegen configuration, React packages, or ObjC++ bridges.
- Keep one default view per Expo module for Expo 52.
- Declare iOS event dispatchers on each concrete Expo view. Expo installs handlers by reflecting the concrete view's stored properties; inherited dispatchers are not installed.
- Use Expo Promise, coded exceptions, and main-queue functions. Do not depend on `@react-native-kakao/core`.
- Initialize the map SDK explicitly before mounting a view. Initialization does not mean authentication or map readiness.
- Each mounted view owns its map engine. Pause when detached/inactive, resume when attached/active, and release observers, listeners, and engine resources on destruction.
- Each object manager owns only its layers, styles, callbacks, and animations. Namespace native registrations, preserve public IDs in results, and avoid SDK-wide clearing that can remove another manager's objects.
- Image-backed scene replacement cancels superseded loads and rejects pending ref promises. Late callbacks must match the current scene, native object, and operation identity before emitting.
- Public screen/image/style dimensions use Android dp and iOS points; public model geometry uses meters, and geographic primitives use ground meters. Convert iOS model point offsets to the SDK's angular model coordinates; Android points and primitive dimensions remain in meters. Do not scale model geometry by display density or promise equal ground distances for the same model and geographic values. Path `cornerRadius` and `jumpThreshold` have undocumented SDK units and pass through without density conversion.
- Android style/animator registries without removal APIs live until engine destruction. Reuse identical definitions and distinguish active wrapper counts from retained SDK registrations when profiling.
- Public angles are degrees; SDK angles are radians. Verify rotation direction and camera round trips on both platforms.
- Camera props trigger movement only when their values change. Initial camera is consumed once. Ref movement resolves when dispatched, not when animation ends.
- Web imports must remain safe; invoking the map on web must report unsupported platform explicitly.
- Android SDK supports ARM only. Skip map runtime scenarios explicitly on x86_64 CI; do not skip other packages' scenarios.
- Verify actual tiles and the visible Kakao logo on local ARM Android and iOS, plus map events, camera movement, navigation re-entry, and background restoration.
- Verify object geometry and animation effects through visible pixels after confirming a new command sequence. Promise completion, object counts, and matching native getter values do not prove rendering; keep failed SDK combinations explicit in the usage guide.
- Preserve RN 0.76 / Expo 52 minimum support with `script/ci-minimum-expo.ts` builds in addition to current example builds. Map does not participate in React Native Codegen.
