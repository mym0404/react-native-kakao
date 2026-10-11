#!/usr/bin/env node
import { $ } from 'zx';

for (const file of process.argv.slice(2)) {
  const result = await $({
    stdio: 'inherit',
    nothrow: true,
  })`swiftformat ${file} --config .swiftformat --quiet`;

  if (result.exitCode !== 0) {
    process.exitCode = result.exitCode ?? 1;

    break;
  }
}
