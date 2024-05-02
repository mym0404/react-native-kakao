#!/usr/bin/env bash
set -e
echo $1

yarn web:path:check
yarn lint
yarn build

V=$1

lerna version $V --force-publish --allow-peer-dependencies-update \
      --exact --remote-client github --create-release github
