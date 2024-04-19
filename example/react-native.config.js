const path = require('path');
const pak = require('../packages/share/package.json');

module.exports = {
  dependencies: {
    [pak.name]: {
      root: path.join(__dirname, '../packages/share'),
    },
  },
};
