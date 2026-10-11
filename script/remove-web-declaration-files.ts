#!/usr/bin/env node
import { fs, glob, path } from 'zx';

const packages = path.resolve(import.meta.dirname, '../packages');
const directories = process.argv.slice(2);
const workspaces = directories.length
  ? directories.map((directory) => path.resolve(directory))
  : (await fs.readdir(packages)).map((directory) => path.join(packages, directory));

for (const workspace of workspaces) {
  if (!(await fs.pathExists(path.join(workspace, 'package.json')))) {
    continue;
  }

  const lib = path.join(workspace, 'lib');
  const files = await glob('**/*.web.d.ts{,.map}', { cwd: lib, absolute: true });
  for (const file of files) {
    await fs.unlink(file);
    console.log(`Removed: ${file}`);
  }
}
