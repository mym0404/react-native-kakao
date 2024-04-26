#!/usr/bin/env bash

cd android && ./gradlew assembleDebug --no-daemon --console=plain -PreactNativeArchitectures=arm64-v8a
