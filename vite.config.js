import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const excludeStellariumData = process.env.EXCLUDE_STELLARIUM_DATA === 'true';

function stellariumDataExclude(outDir) {
  return {
    name: 'stellarium-data-exclude',
    apply: 'build',
    async closeBundle() {
      if (!excludeStellariumData) return;
      const target = resolve(process.cwd(), outDir, 'stellarium-data');
      await rm(target, { recursive: true, force: true });
      this.warn?.('Removed stellarium-data from build output (EXCLUDE_STELLARIUM_DATA=true)');
    },
  };
}

const OUT_DIR = process.env.VITE_OUT_DIR || 'dist';

export default defineConfig({
  plugins: [vue(), stellariumDataExclude(OUT_DIR)],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    open: true,
  },
  build: {
    target: 'esnext',
    outDir: OUT_DIR,
    assetsInlineLimit: 0,
    emptyOutDir: true,
  },
});
