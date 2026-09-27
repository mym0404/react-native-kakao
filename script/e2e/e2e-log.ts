import { writeFile } from 'node:fs/promises';
import { type ProcessPromise } from 'zx';

export const logCommand = async (command: ProcessPromise, path: string) => {
  const result = await command.nothrow();
  await writeFile(path, result.stdout + result.stderr);
  if (result.exitCode !== 0) {
    throw new Error(`Command exited ${result.exitCode}. See ${path}`);
  }
};
