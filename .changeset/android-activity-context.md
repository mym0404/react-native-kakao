---
"@react-native-kakao/channel": patch
"@react-native-kakao/navi": patch
"@react-native-kakao/share": patch
---

Use `reactApplicationContext.currentActivity` in the Android modules instead of the bare `currentActivity` getter, so they compile on React Native releases where `ReactContextBaseJavaModule` no longer exposes it to Kotlin subclasses.