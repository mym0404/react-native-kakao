#!/usr/bin/env bash
set -e

ktlint --color --format --relative --editorconfig=packages/core/android/.editorconfig "$@"
