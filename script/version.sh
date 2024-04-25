#!/usr/bin/env bash

yarn lint
yarn build

V = $1

lerna version --force-publish --allow-peer-dependencies-update --changelog-include-commits-client-login " by @%l" \
      --remote-client github $V
