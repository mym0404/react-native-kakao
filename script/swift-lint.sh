#!/usr/bin/env bash
set -e
for file in "$@"; do
#    echo "🪽 swiftformat $dir"
    swiftformat $file --config .swiftformat --lint --quiet
done
