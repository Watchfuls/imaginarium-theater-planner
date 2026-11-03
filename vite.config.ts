import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  publicDir: resolve(__dirname, '../genshin-shared'),
  build: {
    copyPublicDir: false,
    rollupOptions: {
      input: {main:resolve(__dirname,'index.html'),privacy:resolve(__dirname,'privacy.html')},
    },
  },
  plugins: [{
    name: 'copy-shared-icons',
    apply: 'build',
    writeBundle() {
      cpSync(resolve(__dirname, 'src/assets/site-preview.png'),resolve(__dirname, 'dist/site-preview.png'));
      cpSync(
        resolve(__dirname, '../genshin-shared/icons'),
        resolve(__dirname, 'dist/icons'),
        { recursive: true },
      );
    },
  }],
});
