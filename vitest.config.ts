import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/__tests__/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'client/src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    // Run integration tests serially to avoid database race conditions
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types.ts',
        '**/vite.config.ts',
        '**/vitest.config.ts',
        '**/tailwind.config.ts',
        '**/postcss.config.js',
        '**/*.d.ts',
        '**/index.ts',
        'client/src/__tests__/**',
        'cypress/**',
        'server/vite.ts',
        'drizzle.config.ts',
      ],
      include: [
        'client/src/**/*.{ts,tsx}',
        'server/**/*.{ts,tsx}',
      ],
      all: true,
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
        autoUpdate: false,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets'),
      '@lib': path.resolve(__dirname, './client/src/lib'),
      '@components': path.resolve(__dirname, './client/src/components'),
      '@hooks': path.resolve(__dirname, './client/src/hooks'),
      '@pages': path.resolve(__dirname, './client/src/pages'),
      '@/__tests__': path.resolve(__dirname, './client/src/__tests__'),
    },
  },
});
