/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/*.legacy.ts', '**/transient_*', '**/node_modules/**'],
    globals: true,
  },
});
