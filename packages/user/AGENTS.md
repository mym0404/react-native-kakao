# User Package Rules

Scope: `/packages/user`

User is a high-complexity hotspot due to auth/session/profile APIs and large payload mapping.

## High-risk files

- `src/spec/NativeKakaoUser.ts`
- `src/index.ts`
- `src/index.web.ts`
- `android/src/main/java/.../RNCKakaoUserModule.kt`
- `ios/RNCKakaoUser.mm`
- `ios/RNCKakaoUserManager.swift`
- `ios/RNCKakaoUserUtil.h`
- `ios/RNCKakaoUserUtil.mm`

## Contract rules

- TS spec is the source of truth for method names and signatures.
- Keep auth-related payload keys and optional fields consistent across Android/iOS/web.
- Keep Promise resolution behavior aligned for success/empty/error cases.

## Bridge layering rules

- `.mm` only exports methods and forwards to Swift manager.
- Swift manager owns SDK calls, thread handling, and response mapping.
- Android module owns SDK callbacks and Promise resolve/reject mapping.
- Web implementation must keep API names and return shape aligned with native contract.

## URL callback integration note

`RNCKakaoUserUtil` is an integration surface for URL handling.
When login callback behavior changes, review:

- `ios/RNCKakaoUserUtil.h`
- `ios/RNCKakaoUserUtil.mm`
- `/packages/core/expo-config-plugin/src/withIos.ts`

## Adding a new user API safely

1. Update `src/spec/NativeKakaoUser.ts`.
2. Add wrapper and exported API in `src/index.ts`.
3. Add web implementation in `src/index.web.ts`.
4. Update Android old/new spec and `RNCKakaoUserModule.kt`.
5. Update iOS `RNCKakaoUser.mm` export + `RNCKakaoUserManager.swift` implementation.
6. Regenerate codegen and verify example login/profile flows.

## Common failure patterns

- Updating native modules without updating web counterpart.
- Inconsistent nullable field handling between Kotlin and Swift mapping.
- Returning differently shaped objects per platform for same API.
- Breaking callback URL path without touching UserUtil/plugin side.

## Verification

- `yarn codegen`
- `yarn lint`
- `yarn typecheck`
- example auth flow smoke test (`/example/AGENTS.md`)
