#!/usr/bin/env bash

echo $1

yarn lint
yarn build

V=$1

lerna version $V --force-publish --allow-peer-dependencies-update --changelog-include-commits-client-login " by @%l" \
      --exact --remote-client github --create-release github
