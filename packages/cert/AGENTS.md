# Certification Package Rules

Scope: `/packages/cert`. Read `/AGENTS.md` and `/packages/AGENTS.md` first.

## API contracts

- K2100 supports KakaoTalk and Kakao Account certification login. K2220 login uses KakaoTalk and a server-prepared transaction ID. K3220 uses the separate signing API.
- Keep OAuth token fields compatible with `KakaoLoginToken` from the User package.
- Return session and signing timestamps in Unix seconds on both native platforms.
- Normalize missing local public keys and sessions to `undefined` in the public TypeScript wrapper. Preserve nullable fields inside server responses.
- Keep private keys inside the native SDK; never expose private key material to JavaScript.
- Web supports certification authorization redirects; native-only key and session operations reject explicitly.

## Native callback ownership

- `RNCKakaoCertUtil` forwards K3220 callback URLs to the SDK. Preserve its explicit Swift method name when editing the Objective-C header.
- The iOS SDK stores one global signing callback. The Swift manager owns the active request identifier, rejects concurrent signing requests, ignores stale completions, and clears the SDK callback on completion or failure.
- Keep regular login callbacks in `RNCKakaoUserUtil`. Review the Core Expo plugin when either callback route changes.
- Cert imports, the Android Cert handler activity, and the iOS KakaoTalk query scheme are opt-in through the Core Expo plugin.

## Verification

- Run the common Codegen, lint, package, and native example build gates.
- Verify local key creation and reuse, missing-session behavior, and key deletion on both native platforms.
- Verify the generated User and Cert callbacks coexist and repeated plugin application does not duplicate them.
- Distinguish local key/session checks from successful certification, which requires an approved product and server transaction.
