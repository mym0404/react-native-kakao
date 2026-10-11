#!/usr/bin/env node
import { $ } from 'zx';

for (const file of process.argv.slice(2)) {
  // echo "🦋 clang-format ${file}"
  const result = await $({ stdio: 'inherit', nothrow: true })`clang-format -i ${file}`;
  if (result.exitCode !== 0) {
    process.exitCode = result.exitCode ?? 1;

    break;
  }
}
