import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  publicDir: resolve(__dirname, '../genshin-shared'),
  build: {
    copyPublicDir: false,
  },
  plugins: [{
    name: 'copy-shared-icons',
    apply: 'build',
    writeBundle() {
      cpSync(
        resolve(__dirname, '../genshin-shared/icons'),
        resolve(__dirname, 'dist/icons'),
        { recursive: true },
      );
    },
  }],
});