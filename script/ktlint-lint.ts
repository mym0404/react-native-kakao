#!/usr/bin/env node
import { $ } from 'zx';

const result = await $({
  nothrow: true,
  stdio: 'inherit',
})`ktlint --color --relative --editorconfig=packages/core/android/.editorconfig ${process.argv.slice(2)}`;

if (result.exitCode !== 0) {
  process.exitCode = result.exitCode ?? 1;
}
