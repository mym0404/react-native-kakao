const config = require('@react-native/eslint-config');

module.exports = {
  ...config,
  plugins: config.plugins.filter((name) => name !== 'jest'),
  rules: Object.fromEntries(
    Object.entries(config.rules).filter(([name]) => !name.startsWith('jest/')),
  ),
  overrides: config.overrides.map((override) => ({
    ...override,
    ...(override.env && {
      env: Object.fromEntries(
        Object.entries(override.env).filter(([name]) => !name.startsWith('jest')),
      ),
    }),
  })),
};
