#!/usr/bin/env bash

cd example/android && ./gradlew assembleDebug --no-daemon --console=plain -PreactNativeArchitectures=arm64-v8a
