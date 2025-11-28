# Mock Mode Guide for Touch-N-Stars

This guide explains how to use Mock Mode to test the Touch-N-Stars UI without requiring N.I.N.A to be running.

## What is Mock Mode?

Mock Mode is a development feature that allows you to test and explore the Touch-N-Stars UI without needing a real N.I.N.A backend connection. It provides simulated responses for all major API calls, allowing you to:

- Test UI components and layouts
- Explore the application's features
- Develop and test new features
- Debug UI issues
- Demo the application
- Avoid plugin routes loading while offline (plugins are skipped in mock mode)

## How to Enable Mock Mode

### Option 1: Using Browser Developer Tools

1. Open Touch-N-Stars in your browser.
2. Open the browser's Developer Tools (F12 or right-click > Inspect).
3. Go to the Console tab.
4. Type the following command and press Enter:
   ```javascript
   localStorage.setItem('USE_MOCK_API', 'true')
   ```
5. Refresh the page.

### Option 2: Programmatically

You can also add this line in your code before the app starts:
```javascript
localStorage.setItem('USE_MOCK_API', 'true');
```

## How to Disable Mock Mode

To return to using the real N.I.N.A API:

1. Open the browser's Developer Tools Console.
2. Type:
   ```javascript
   localStorage.removeItem('USE_MOCK_API')
   ```
3. Refresh the page.

## What Data is Simulated?

Mock Mode provides realistic simulated data for:

### Equipment Status
- **Camera**: ZWO ASI294MC Pro (connected, cooled to -10°C)
- **Mount**: Celestron AVX (connected, tracking)
- **Filter Wheel**: ZWO EFW with 7 filters (L, R, G, B, Ha, OIII, SII)
- **Focuser**: ZWO EAF (connected, position 5000)
- **Rotator**: Not connected
- **Guider**: PHD2 (not connected)
- **Flat Device**: Not connected
- **Dome**: Not connected
- **Weather**: Not connected
- **Target/Framing**: Static placeholder image returned for target pictures

### Sequences
Three example sequences are available:
- M31 (Andromeda)
- M42 (Orion)
- NGC7000 (North America Nebula)

### Favorites
Empty list that you can populate and manipulate.

### Settings
Persistent settings storage using mock implementation with sane defaults for flat wizard, snapshot, plate solve, framing, etc.

## Testing Features

### Plugins and Shortcuts

- Plugins are skipped entirely in mock mode to avoid stale or duplicated routes.
- Shortcuts UI continues to work with mock actions.

### Equipment Control

You can test all equipment controls:
- Camera capture (simulates exposure time delays)
- Mount movement and slewing
- Filter changes (simulates 500ms delay)
- Focuser movement (simulates 500ms delay)
- Sequence start/stop/pause
- Framing target image returns a static placeholder (no backend call)
- WebSocket is skipped; UI uses polling in mock mode

### Limitations

Mock Mode has some limitations:

1. **No Real Images**: Image capture returns success but no actual images.
2. **No Plate Solving**: Plate solve operations return mock success.
3. **No PHD2 Integration**: PHD2 calls return mock data.
4. **Static Weather Data**: Weather information doesn't change.
5. **No Real Equipment Changes**: Equipment states are simulated.
6. **Plugins Disabled**: Built-in plugins do not load in mock mode.

## Customizing Mock Data

You can customize the mock data by modifying the `mockState` object in `/src/services/mockApiService.js`:

```javascript
const mockState = {
  isConnected: true,
  apiVersion: '2.2.12.0',
  equipment: {
    camera: { connected: true },
    mount: { connected: true },
    // ... modify as needed
  },
  sequences: [
    // Add your own sequences
  ],
  favorites: [
    // Add test favorites
  ],
};
```

You can also manipulate mock state at runtime (when not in production):

```javascript
import { mockState } from '@/services/mockApiService';

// Disconnect camera
mockState.equipment.camera.connected = false;

// Add a favorite
mockState.favorites.push({
  id: '123',
  name: 'M31',
  ra: 10.68,
  dec: 41.27,
});
```

## Debugging

When Mock Mode is active, you'll see console messages like:
```
[MOCK MODE] Using mock implementation for: cameraAction
[MOCK MODE] Using mock implementation for: mountAction
[MOCK MODE] Skipping WebSocket connection
```

This helps you verify that mock mode is working correctly.

## Tips for Development

1. **Start Development**: Always test UI changes in Mock Mode first.
2. **Check Console**: Monitor console for mock mode messages.
3. **Test Transitions**: Test switching between mock and real mode.
4. **Verify Delays**: Mock operations include realistic delays (e.g., filter changes).
5. **Error Scenarios**: Modify mock state to test error handling.

## Troubleshooting

### Mock Mode Not Working

1. Verify localStorage is set:
   ```javascript
   console.log(localStorage.getItem('USE_MOCK_API'));
   ```
   Should return `"true"`.

2. Hard refresh the page (Ctrl+F5 / Cmd+Shift+R).

3. Check browser console for errors.

### Switching Between Modes

If you experience issues switching modes:
1. Clear localStorage completely.
2. Close all browser tabs.
3. Restart the application.
4. Re-enable mock mode if needed.

## Contributing

If you add new API methods, please also add corresponding mock implementations in `mockApiService.js` to ensure Mock Mode remains fully functional.
