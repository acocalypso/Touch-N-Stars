#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to convert plugin name to ID (lowercase, spaces to hyphens)
function nameToId(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// Function to ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to create a file with content
function createFile(filePath, content) {
  fs.writeFileSync(filePath, content);
  console.log(`Created file: ${filePath}`);
}

console.log('====================================');
console.log('Touch-N-Stars Plugin Generator');
console.log('====================================');

// Ask questions to gather plugin information
rl.question('Plugin name: ', (name) => {
  rl.question('Description: ', (description) => {
    rl.question('Author: ', (author) => {
      // Create plugin ID from name
      const id = nameToId(name);
      
      // Define paths
      const pluginDir = path.join(__dirname, '..', 'src', 'plugins', id);
      const componentsDir = path.join(pluginDir, 'components');
      const viewsDir = path.join(pluginDir, 'views');
      
      // Create directory structure
      ensureDirectoryExists(pluginDir);
      ensureDirectoryExists(componentsDir);
      ensureDirectoryExists(viewsDir);
      
      // Create plugin.json
      const pluginJson = {
        id,
        name,
        description,
        version: '1.0.0',
        author,
        defaultEnabled: false, //initial value for the first load
        enabled: true //Plugin is completely hidden
      };
      
      createFile(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify(pluginJson, null, 2)
      );
      
      // Create index.js
      const indexJs = `// Import your icon component here
// import YourPluginIcon from './components/YourPluginIcon.vue';
import { h, markRaw } from 'vue';
import DefaultPluginView from './views/${id}.vue';
import { usePluginStore } from '@/store/pluginStore';
import metadata from './plugin.json';

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;

    // Get current plugin state from store
    const currentPlugin = pluginStore.plugins.find((p) => p.id === metadata.id);
    
    // Generate sequential plugin path if not already assigned
    let pluginPath;
    if (currentPlugin && currentPlugin.pluginPath) {
      pluginPath = currentPlugin.pluginPath;
    } else {
      // Find the next available plugin number
      const existingPaths = pluginStore.plugins
        .map(p => p.pluginPath)
        .filter(path => path && path.match(/^\\/plugin\\d+$/))
        .map(path => parseInt(path.replace('/plugin', '')))
        .sort((a, b) => a - b);
      
      let nextNumber = 1;
      for (const num of existingPaths) {
        if (num === nextNumber) {
          nextNumber++;
        } else {
          break;
        }
      }
      
      pluginPath = \`/plugin\${nextNumber}\`;
    }

    // Register route with generic plugin path
    router.addRoute({
      path: pluginPath,
      component: DefaultPluginView,
      meta: { requiresSetup: true },
    });

    // Add navigation item if the plugin is enabled in the store
    if (currentPlugin && currentPlugin.enabled) {
      pluginStore.addNavigationItem({
        pluginId: metadata.id,
        path: pluginPath,
        // Replace with your custom icon component when available
        icon: markRaw({
          render() {
            // Default simple icon - a square
            return h('svg', {
              xmlns: 'http://www.w3.org/2000/svg',
              fill: 'none',
              viewBox: '0 0 24 24',
              'stroke-width': '1.5',
              stroke: 'currentColor'
            }, [
              h('rect', {
                x: 3,
                y: 3,
                width: 18,
                height: 18,
                rx: 2
              })
            ]);
          }
        }),
        title: metadata.name,
      });
    }
  },
};`;

      createFile(path.join(pluginDir, 'index.js'), indexJs);
      
      // Create default view component
      const defaultViewVue = `<template>
  <div class="container py-16 flex items-center justify-center">
    <div class="container max-w-4xl">
      <h5 class="text-2xl text-center font-bold text-white mb-4">${name}</h5>
      
      <div class="flex flex-col space-y-4">
        <div class="border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5">
          <p class="text-white text-center">
            Welcome to the ${name} plugin!
          </p>
          <p class="text-gray-400 text-center mt-2">
            ${description}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Add your component logic here
</script>`;

      createFile(path.join(viewsDir, `${id}.vue`), defaultViewVue);
      
      console.log('====================================');
      console.log(`Plugin "${name}" created successfully!`);
      console.log(`Location: src/plugins/${id}/`);
      console.log('');
      console.log('Regenerating plugin registry...');
      
      // Import and run the plugin registry generator
      import('./generate-plugin-registry.js').then(() => {
        console.log('Plugin registry updated!');
        console.log('====================================');
        rl.close();
      }).catch((error) => {
        console.error('Error updating plugin registry:', error);
        rl.close();
      });
    });
  });
});