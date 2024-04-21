#!/bin/bash

if which swiftformat >/dev/null; then

  for dir in ./packages/*/ios; do
    echo "${dir}"
    find $dir -type f \( -name "*.swift" \) -print0 | while read -d $'\0' file; do
      echo "🪽 swiftformat $file"
      swiftformat "$file" --config .swiftformat
    done
  done


else
  echo "warning: swiftformat not installed, download from https://github.com/nicklockwood/SwiftFormat"
fi