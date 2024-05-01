#!/usr/bin/env bash

cd example/ios && xcodebuild -workspace KakaoExample.xcworkspace -scheme KakaoExample -configuration Debug -sdk iphonesimulator -quiet CC=clang CPLUSPLUS=clang++ LD=clang LDPLUSPLUS=clang++ GCC_OPTIMIZATION_LEVEL=0 GCC_PRECOMPILE_PREFIX_HEADER=YES ASSETCATALOG_COMPILER_OPTIMIZATION=time DEBUG_INFORMATION_FORMAT=dwarf COMPILER_INDEX_STORE_ENABLE=NO ONLY_ACTIVE_ARCH=YES
