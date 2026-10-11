import { fs, type ProcessPromise } from 'zx';

export const logCommand = async (command: ProcessPromise, path: string) => {
  command.quiet().nothrow();
  command.stdout.pipe(process.stdout, { end: false });
  command.stderr.pipe(process.stderr, { end: false });

  const result = await command;
  await fs.writeFile(path, result.stdout + result.stderr);
  if (result.exitCode !== 0) {
    throw new Error(
      `Command exited ${result.exitCode}${result.signal ? ` (${result.signal})` : ''}. See ${path}`,
    );
  }
};
