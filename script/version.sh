#!/usr/bin/env bash

yarn lint
yarn build

lerna version --force-publish --allow-peer-dependencies-update --changelog-include-commits-client-login " by @%l" --dry-run
