#!/usr/bin/env node
import { $ } from 'zx';

for (const file of process.argv.slice(2)) {
  console.log(`Linting Swift file: ${file}`);

  const result = await $({
    stdio: 'inherit',
    nothrow: true,
  })`swiftformat ${file} --config .swiftformat --lint`;

  if (result.exitCode !== 0) {
    process.exitCode = result.exitCode ?? 1;

    break;
  }
}
