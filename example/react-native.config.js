const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const packages = path.resolve(root, 'packages');

// List all packages under `packages/`
/** @type {string[]} */
const workspaces = fs
  .readdirSync(packages)
  .map((p) => path.join(packages, p))
  .filter(
    (p) =>
      fs.statSync(p).isDirectory() &&
      fs.existsSync(path.join(p, 'package.json'))
  );

/** @type {Record<string, {root: string}>} */
const dependencies = {};
workspaces.forEach((workspace) => {
  const pak = JSON.parse(
    fs.readFileSync(path.join(workspace, 'package.json'), 'utf8')
  );
  dependencies[pak.name] = { root: workspace };
});

module.exports = {
  dependencies,
};
