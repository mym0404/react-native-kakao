#!/usr/bin/env bash
set -e
echo $1

yarn lint
yarn build

lerna version prerelease --force-publish --allow-peer-dependencies-update \
      --exact --remote-client github --create-release github
