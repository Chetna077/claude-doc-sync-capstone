const { defineConfig } = require('@playwright/test');
const path = require('node:path');

module.exports = defineConfig({
  testDir: './e2e',
  use: {
    baseURL: `file://${path.resolve(__dirname)}/`,
  },
});
