import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
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

function isKnownDependencyAnnotationWarning(log) {
  if (log?.code !== 'INVALID_ANNOTATION') return false;

  const file = (log.loc?.file || log.id || '').replaceAll('\\', '/');
  return (
    file.includes('/node_modules/@microsoft/signalr/') ||
    file.includes('/node_modules/@daybrush/utils/')
  );
}

function isBuildTimingNotice(log) {
  return log?.code === 'PLUGIN_TIMINGS';
}

export default defineConfig({
  plugins: [tailwindcss(), vue(), stellariumDataExclude(OUT_DIR)],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
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
    rolldownOptions: {
      onLog(level, log, handler) {
        if (isKnownDependencyAnnotationWarning(log) || isBuildTimingNotice(log)) {
          return;
        }
        handler(level, log);
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vue-vendor',
              test: /node_modules[\\/](vue|@vue|vue-router|pinia|vue-i18n|@unhead)[\\/]/,
              priority: 30,
            },
            {
              name: 'realtime-vendor',
              test: /node_modules[\\/](@microsoft[\\/]signalr|@novnc[\\/]novnc)[\\/]/,
              priority: 25,
            },
            {
              name: 'charts-vendor',
              test: /node_modules[\\/](chart\.js|@kurkle)[\\/]/,
              priority: 20,
            },
            {
              name: 'media-vendor',
              test: /node_modules[\\/](@capacitor|@capacitor-community|@capawesome|@capgo)[\\/]/,
              priority: 15,
            },
            {
              name: 'network-vendor',
              test: /node_modules[\\/](axios)[\\/]/,
              priority: 14,
            },
            {
              name: 'zip-vendor',
              test: /node_modules[\\/](jszip)[\\/]/,
              priority: 13,
            },
            {
              name: 'interaction-vendor',
              test: /node_modules[\\/](@daybrush|vue3-moveable|@scena|@egjs|@cfcs|overlap-area|css-styled|framework-utils|croact|@pinkcao[\\/]vue-drag-resize-rotate|@panzoom[\\/]panzoom|vue-draggable-next|vuedraggable|sortablejs)[\\/]/,
              priority: 12,
            },
            {
              name: 'utility-vendor',
              test: /node_modules[\\/](date-fns|papaparse|lodash|uuid|file-saver)[\\/]/,
              priority: 11,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
