import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: 90,
        functions: 90,
        lines: 90,
        branches: 85
      },
      exclude: [
        'node_modules/**/*',
        'tests/**/*',
        'vite.config.js',
        'tailwind.config.js',
        'postcss.config.js'
      ]
    }
  }
});
