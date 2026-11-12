/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,js}'],
    exclude: ['**/*.legacy.ts', '**/node_modules/**'],
    globals: true,
    environment: 'happy-dom',
  },
});