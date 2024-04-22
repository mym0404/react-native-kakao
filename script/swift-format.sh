#!/usr/bin/env bash

if which swiftformat >/dev/null; then
  for dir in ./packages/*/ios; do
      echo "🪽 swiftformat $dir"
      swiftformat $dir --config .swiftformat  --quiet
  done
else
  echo "warning: swiftformat not installed, download from https://github.com/nicklockwood/SwiftFormat"
fi