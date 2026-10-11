#!/usr/bin/env node
import { $ } from 'zx';

for (const file of process.argv.slice(2)) {
  // echo "🦋 clang-lint ${file}"
  const result = await $({
    stdio: 'inherit',
    nothrow: true,
  })`clang-format --dry-run -Werror ${file}`;

  if (result.exitCode !== 0) {
    process.exitCode = result.exitCode ?? 1;

    break;
  }
}
