#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { fs, path } from 'zx';

const { values } = parseArgs({
  options: {
    check: { type: 'boolean', default: false },
    convert: { type: 'string' },
  },
});

if (!values.check && values.convert !== 'src' && values.convert !== 'module') {
  throw new Error('Pass --check or --convert=src|module');
}

const packages = path.resolve(import.meta.dirname, '../packages');
for (const name of await fs.readdir(packages)) {
  const file = path.join(packages, name, 'package.json');
  if (!(await fs.pathExists(file))) {
    continue;
  }

  const content = await fs.readFile(file, 'utf8');
  if (values.check) {
    if (!content.includes('"module": "lib/module/index"')) {
      throw new Error(`${name}/package.json: module must be lib/module/index`);
    }
  } else {
    await fs.writeFile(
      file,
      content.replace(
        /"module": ".*?"/,
        values.convert === 'src' ? '"module": "src/index"' : '"module": "lib/module/index"',
      ),
    );
    console.log(`Changed module path to ${values.convert}: ${name}`);
  }
}

if (values.check) {
  console.log('All module paths passed.');
}
