#!/usr/bin/env bash
set -e
for file in "$@"; do
    swiftformat "$file" --config .swiftformat --quiet
done
