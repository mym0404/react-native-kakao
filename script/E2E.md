# Example 앱 E2E 검증

`script/e2e.ts`를 Bun·ZX로 실행하고 agent-device로 화면을 검증해요.
Bun과 agent-device 버전은 루트 `mise.toml`에서 관리해요.

홈 → User → 홈 → Share → 홈 → Navi → 홈 → Social → 홈 → Channel 순서로 이동해요.
화면마다 제목을 확인하고 홈을 포함해 스크린샷 6장을 남겨요.
로그인, 기능 버튼 실행, 기준 이미지와의 픽셀 비교는 포함하지 않아요.

## 로컬 실행

저장소 루트에서 도구와 의존성을 준비해요.

```sh
mise install
mise exec -- yarn install --immutable
mise exec -- yarn build
mise exec -- yarn new
mise exec -- yarn example pod:new
```

Android SDK·JDK와 Xcode·iOS Simulator가 필요해요.
사용할 Android 에뮬레이터와 iOS 시뮬레이터를 먼저 부팅하고 ID를 확인해요.

```sh
adb devices
xcrun simctl list devices booted
```

Release·new architecture 앱을 빌드해요. Android ABI는 실행하는 컴퓨터의 CPU를 기준으로 정해요.
다른 ABI의 에뮬레이터에서는 `--abi arm64-v8a` 또는 `--abi x86_64`를 지정해요.

```sh
mise exec -- yarn e2e build android
mise exec -- yarn e2e build ios
```

아래 ID를 실제 기기 ID로 바꿔 실행해요. 테스트 명령은 앱을 설치하고 실행하며, 다시 빌드하지 않아요.

```sh
mise exec -- yarn e2e test android --device emulator-5554
mise exec -- yarn e2e test ios --device SIMULATOR_UDID
```

각 실행 결과는 `build/e2e/<platform>/<timestamp>/`에 저장돼요.
`index.html`을 열면 6개 화면을 함께 볼 수 있어요.
앱 코드가 바뀌면 해당 플랫폼의 빌드 명령을 다시 실행해요.

## 실행 옵션과 산출물

| 옵션            | 동작                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------ |
| `--app PATH`    | 이미 빌드한 APK 또는 Simulator용 `.app`을 설치해요. Release·new architecture 앱을 지정해요 |
| `--output PATH` | 결과 폴더를 지정해요. 이전 실행의 `run.json`이 있으면 덮어쓰지 않고 실패해요               |
| `--video`       | 같은 화면 이동을 녹화해 `native/` 아래 MP4로 저장해요                                      |
| `--help`        | 명령 사용법을 출력해요                                                                     |

결과 폴더에는 PNG 6장, JUnit, 설치·테스트 로그, 생성된 `.ad`, `summary.json`, `index.html`이 남아요.
agent-device가 `native/`에 스크린샷 복사본과 단계별 로그도 저장해요.
빌드 로그는 `build/e2e/<platform>/build.log`에 저장해요.
화면 진입 실패나 PNG 누락은 종료 코드 1로 전달해요. 자동 재시도는 0회예요.
요약의 테스트 시간은 앱 설치와 빌드를 제외하고, 영상 옵션을 사용하면 녹화 시간을 포함해요.

## GitHub CI와 PR 댓글

기존 CI의 `build-android (new)`와 `build-ios (new)`에서 Release 앱을 빌드한 뒤 같은 스크립트를 실행해요.
Android는 Ubuntu의 API 35·x86_64 에뮬레이터, iOS는 Xcode 26.2의 iPhone 17 Pro Simulator를 사용해요.
Android old architecture 빌드와 기존 필수 체크 이름은 유지해요.
E2E는 빌드 성공 캐시만으로 생략하지 않아요. Gradle·Pods 의존성 캐시는 재사용해요.

성공·실패 시 결과 폴더를 GitHub Actions artifact로 업로드하고 14일간 보관해요.
같은 저장소의 PR에는 플랫폼별 통과 여부·테스트 시간·스크린샷 수·다운로드 링크를 댓글 하나로 갱신해요.
빌드나 기기 준비가 실패해 테스트를 시작하지 못하면 `미실행`으로 표시해요.
이전 커밋의 실행 결과로 최신 PR 댓글을 덮어쓰지 않아요.

Fork PR에서도 빌드·E2E·artifact 업로드는 실행해요.
Fork의 읽기 전용 토큰으로는 댓글을 쓸 수 없어 댓글 job을 생략해요.
다운로드한 ZIP의 `index.html`에서 스크린샷을 확인할 수 있어요.
