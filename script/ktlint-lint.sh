#!/usr/bin/env bash

if which ktlint >/dev/null; then
  for dir in ./packages/*/android; do
          echo "🌊 ktlint $dir"
    ktlint --relative --color --editorconfig=packages/core/android/.editorconfig $dir
  done
else
  echo "warning: ktlint not installed, download from https://pinterest.github.io/ktlint/latest/install/setup/"
fi