#!/usr/bin/env bash
set -e
for file in "$@"; do
    printf 'Linting Swift file: %s\n' "$file"
    swiftformat "$file" --config .swiftformat --lint
done
