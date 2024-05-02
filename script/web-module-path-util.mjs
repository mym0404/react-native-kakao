#!/usr/bin/env zx

// region ZX Util
import fs from 'fs-extra';

const join = path.join;
const filename = path.basename(__filename);
const cwd = process.cwd();
const exit = process.exit;
const _printTag = '' || filename;

function exist(path) {
  return fs.existsSync(path);
}

function isDir(path) {
  return exist(path) && fs.lstatSync(path).isDirectory();
}

function isFile(path) {
  return exist(path) && fs.lstatSync(path).isFile();
}

async function iterateDir(path, fn) {
  if (!isDir(path)) {
    return;
  }

  for (const file of fs.readdirSync(path)) {
    await fn(file);
  }
}

function read(path) {
  return fs.readFileSync(path, { encoding: 'utf8' });
}

// you should require when possible(optimized in js)
function readJsonSlow(path) {
  return fs.readJSONSync(path);
}

function write(p, content) {
  const dir = path.dirname(p);
  if (!exist(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return fs.writeFileSync(p, content);
}

function writeJson(path, json) {
  return write(path, JSON.stringify(json, null, 2));
}

function remove(path) {
  if (!exist(path)) {
    return;
  }

  if (fs.lstatSync(path).isDirectory()) {
    return fs.rmSync(path, { force: true, recursive: true });
  } else {
    return fs.rmSync(path, { force: true });
  }
}

function addLine(str, added, backward = false) {
  if (backward) {
    return added + '\n' + str;
  } else {
    return str + '\n' + added;
  }
}

function addLineToFile(path, added, backward = false) {
  return write(path, addLine(read(path), added, backward));
}

function print(...args) {
  echo(`\x1B[35m[${_printTag}]`, ...args, '\x1B[0m');
}

function printSuccess(...args) {
  echo(`\x1B[36m\x1B[46m✅  [${_printTag}]`, ...args, '\x1B[0m');
}

function printError(...args) {
  echo(`\x1B[31m\x1b[43m⚠️ [${_printTag}]`, ...args, '\x1B[0m');
}

const tKey = {};

function measureBegin(name = '⏳') {
  print(`=======Start [${name}=======`);
  tKey[name] = Date.now();
}

function measureEnd(name = '⏳') {
  print(
    `=======End [${name}]==[${(Date.now() - tKey[name]).toLocaleString().split('.')[0]}ms]=======`,
  );
}

async function input(message) {
  if (message) {
    return question(message + ': ');
  } else {
    return stdin();
  }
}

async function fixLint(path) {
  await $`yarn prettier ${path} --write --loglevel silent`;
  await $`yarn eslint ${path} --fix --quiet --max-warnings 100`;
}

const HEADING = `// @ts-nocheck
/* eslint-disable */
/**
 * Generated file. Don't modify manually.
 */
 `;

// endregion

const root = join(__dirname, '..');
const workspaces = [];
for (const file of fs.readdirSync('packages')) {
  const p = join(root, 'packages', file);
  if (isDir(p) && isFile(join(p, 'package.json'))) {
    workspaces.push({
      name: file,
      workspacePath: p,
      pkg: join(p, 'package.json'),
      pkgStr: read(join(p, 'package.json')),
    });
  }
}

const isCheckForPathsAreModule = argv.check;
const convert = argv.convert;
if (!isCheckForPathsAreModule && convert !== 'src' && convert !== 'module') {
  printError('`convert` should be src or module');
  await $`exit 1`;
}

for (const { name, workspacePath, pkgStr } of workspaces) {
  if (isCheckForPathsAreModule) {
    if (!pkgStr.includes('"module": "lib/module/index"')) {
      printError(
        `Failed to check package.json of [${name}] \`module\` fields are \`lib/module/index\``,
      );
      await $`exit 1`;
    }
  } else {
    const newPkgStr = pkgStr.replace(
      /"module": ".*?"/,
      convert === 'src' ? '"module": "src/index"' : '"module": "lib/module/index"',
    );
    write(join(workspacePath, 'package.json'), newPkgStr);
    printSuccess(`Change module path to ${convert}: ${name}`);
  }
}
if (isCheckForPathsAreModule) {
  printSuccess(`All passed!`);
}
