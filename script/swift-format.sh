#!/usr/bin/env bash
set -e
for dir in "$@"; do
#    echo "🪽 swiftformat $dir"
    swiftformat $file --config .swiftformat  --quiet
done
