#!/usr/bin/env bash
set -e

ktlint --color --relative --editorconfig=packages/core/android/.editorconfig "$@"
