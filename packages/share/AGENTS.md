# Share Package Rules

Scope: `/packages/share`

Share is a high-complexity hotspot.
Most public APIs are wrappers around one native bridge method and template-type branching.

## High-risk files

- `src/spec/NativeKakaoShare.ts`
- `src/index.ts`
- `src/index.web.ts`
- `src/util/swapMobileExecutionParamsFieldValueIntoStringInIOS.ts`
- `android/src/main/java/.../RNCKakaoShareModule.kt`
- `android/src/main/java/.../RNCKakaoShareTemplates.kt`
- `ios/RNCKakaoShare.mm`
- `ios/RNCKakaoShareManager.swift`

## Share flow model

The core bridge method is:

- `shareOrSendMeOrSendFriendOrWhatever(...)`

JS wrapper methods (`shareFeedTemplate`, `sendFeedTemplateToMe`, etc.) map into:

- `sendType`: `share`, `send-me`, `send-friend`
- `templateType`: `custom`, `feed`, `list`, `location`, `commerce`, `text`, `calendar`

## Non-negotiable parity rules

- Keep `sendType` and `templateType` string vocabulary identical across TS/web/Android/iOS.
- Keep receiver UUID and callback arg handling consistent across platforms.
- Keep template object conversion behavior aligned (including iOS execution-param conversion helper).
- Keep return shape parity:
  - send-friend APIs return successful receiver uuid list shape consistently.

## Adding a new share API safely

1. If this is a new template or send mode, update `src/spec/NativeKakaoShare.ts` first.
2. Add JS wrapper(s) in `src/index.ts` and map to existing bridge contract.
3. Add web implementation in `src/index.web.ts` with matching API name and result shape.
4. Update Android:
   - branch logic in `RNCKakaoShareModule.kt`
   - template creation logic in `RNCKakaoShareTemplates.kt` if needed
5. Update iOS:
   - `RNCKakaoShare.mm` export stays minimal and forwards only
   - `RNCKakaoShareManager.swift` handles template decoding/share-send branches

## Common failure patterns

- Adding wrapper in `index.ts` but missing web implementation.
- Adding new template branch on one native platform only.
- Divergent key casing or payload keys between web/native.
- Editing `.mm` business logic instead of Swift manager logic.

## Verification

- `yarn codegen`
- `yarn lint`
- `yarn typecheck`
- Validate share/send flows in example app (see `/example/AGENTS.md`)
