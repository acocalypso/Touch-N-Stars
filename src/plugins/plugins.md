# Touch 'N' Stars Plugin System

## Overview
The plugin system allows you to extend Touch 'N' Stars with additional features through plugins. Each plugin is a self-contained module that can include its own views, components, and stores.

## Plugin Structure
```
plugins/
  my-plugin/
    index.js           # Plugin entry point
    plugin.json        # Plugin metadata
    components/        # Plugin-specific components
    views/            # Plugin-specific views
    store/            # Plugin-specific store modules
```

## Plugin Metadata (plugin.json)
```json
{
  "id": "unique-plugin-id",
  "name": "Plugin Display Name",
  "description": "Plugin description",
  "version": "1.0.0",
  "author": "Author Name",
  "icon": "SparklesIcon", // Icon from @heroicons/vue/24/outline
  "enabled": false
}
```

## Plugin Entry Point (index.js)
```javascript
import metadata from './plugin.json';

export default {
  metadata,
  install(app, options) {
    const pluginStore = usePluginStore();
    const router = options.router;
    
    // Register components
    // Register routes
    // Register store modules
    // Add navigation items
    
    // Register plugin metadata
    pluginStore.registerPlugin(metadata);
  }
}
```

## Creating a New Plugin

1. Create a new folder in the plugins directory with your plugin name
2. Create a plugin.json file with your plugin metadata
3. Create an index.js file as the entry point
4. Add your components, views, and stores
5. Import and register your plugin in main.js

## Registering Your Plugin
To register your plugin, add it to the plugins array in main.js:

```javascript
// In main.js
import myPlugin from './plugins/my-plugin';

// Add to plugins array
const plugins = [
  // other plugins...
  myPlugin,
];
```

## Example
See the example weather station plugin in `plugins/weather-station/` for a complete implementation.

## Guidelines
- Each plugin should be self-contained
- Use unique identifiers for your plugin
- Follow Vue 3 composition API patterns
- Use Tailwind CSS for styling
- Test your plugin thoroughly before distribution