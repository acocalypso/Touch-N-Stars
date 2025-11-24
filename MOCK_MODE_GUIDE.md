# Mock Mode Guide for Touch-N-Stars

This guide explains how to use Mock Mode to test the Touch-N-Stars UI without requiring N.I.N.A to be running.

## What is Mock Mode?

Mock Mode is a development feature that allows you to test and explore the Touch-N-Stars UI without needing a real N.I.N.A backend connection. It provides simulated responses for all major API calls, allowing you to:

- Test UI components and layouts
- Explore the application's features
- Develop and test new features
- Debug UI issues
- Demo the application

## How to Enable Mock Mode

### Option 1: Using Browser Developer Tools

1. Open Touch-N-Stars in your browser
2. Open the browser's Developer Tools (F12 or right-click > Inspect)
3. Go to the Console tab
4. Type the following command and press Enter:
   ```javascript
   localStorage.setItem('USE_MOCK_API', 'true')
   ```
5. Refresh the page

### Option 2: Programmatically

You can also add this line in your code before the app starts:
```javascript
localStorage.setItem('USE_MOCK_API', 'true');
```

## How to Disable Mock Mode

To return to using the real N.I.N.A API:

1. Open the browser's Developer Tools Console
2. Type:
   ```javascript
   localStorage.removeItem('USE_MOCK_API')
   ```
3. Refresh the page

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

### Sequences
Three example sequences are available:
- M31 (Andromeda)
- M42 (Orion)  
- NGC7000 (North America Nebula)

### Favorites
Empty list that you can populate and manipulate

### Settings
Persistent settings storage using mock implementation

## Testing Features

### Available Plugin Features

All plugins and shortcuts should work in mock mode:

- **Livestack Plugin**: Can start/stop (no actual images)
- **Sequence Creator**: Full functionality with mock sequences
- **Shortcuts**: All shortcuts respond with mock actions
- **Webcam**: Mock camera data
- **Telescopius**: Integration testing with mock coordinates
- **Logfile Collector**: Mock log collection

### Testing Plugins and Shortcuts

To test plugin/shortcut UI without N.I.N.A:

1. Enable Mock Mode (see instructions above)
2. Navigate to the Plugins page
3. All plugin UIs will load with simulated equipment data
4. Test shortcuts from the Shortcuts page
5. All actions will return mock success responses

#### Testing the Shortcuts Plugin in Detail

The Shortcuts plugin has been fully updated with mock data:

**What Works:**
- View existing shortcuts as cards
- Create new shortcuts with custom names, icons, and colors
- Select from mock sequences (M31, M42, NGC7000)
- Edit existing shortcuts
- Delete shortcuts with confirmation
- Execute shortcuts (simulates loading and optionally starting sequences)
- Auto-start toggle functionality

**Step-by-Step Testing:**

1. Navigate to the Shortcuts plugin via the plugins menu
2. You'll see sample shortcuts displayed as colorful cards
3. **Create Test**: Click "New Shortcut"
   - Enter a name (e.g., "Test M31")
   - Select a sequence from the dropdown
   - Choose an icon and color
   - Enable/disable auto-start
   - Click "Create"
4. **Edit Test**: Hover over a shortcut and click the pencil icon
   - Modify any settings
   - Click "Update"
5. **Delete Test**: Hover over a shortcut and click the trash icon
   - Confirm deletion in the modal
6. **Execute Test**: Click on a shortcut card
   - Success toast will appear
   - Sequence will be "loaded" (in mock mode)

All UI interactions work perfectly without N.I.N.A running!

### Equipment Control

You can test all equipment controls:
- Camera capture (simulates exposure time delays)
- Mount movement and slewing
- Filter changes (simulates 500ms delay)
- Focuser movement (simulates 500ms delay)
- Sequence start/stop/pause

### Limitations

Mock Mode has some limitations:

1. **No Real Images**: Image capture returns success but no actual images
2. **No Plate Solving**: Plate solve operations return mock success
3. **No PHD2 Integration**: PHD2 calls return mock data
4. **Static Weather Data**: Weather information doesn't change
5. **No Real Equipment Changes**: Equipment states are simulated

## Customizing Mock Data

You can customize the mock data by modifying the `mockState` object in `/src/services/mockApiService.js`:

```javascript
const mockState = {
  isConnected: true,
  apiVersion: '2.2.11.0',
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

You can also manipulate mock state at runtime:

```javascript
import { mockState } from '@/services/mockApiService';

// Disconnect camera
mockState.equipment.camera.connected = false;

// Add a favorite
mockState.favorites.push({
  id: '123',
  name: 'M31',
  ra: 10.68,
  dec: 41.27
});
```

## Debugging

When Mock Mode is active, you'll see console messages like:
```
[MOCK MODE] Using mock implementation for: cameraAction
[MOCK MODE] Using mock implementation for: mountAction
```

This helps you verify that mock mode is working correctly.

## Tips for Development

1. **Start Development**: Always test UI changes in Mock Mode first
2. **Check Console**: Monitor console for mock mode messages
3. **Test Transitions**: Test switching between mock and real mode
4. **Verify Delays**: Mock operations include realistic delays (e.g., filter changes)
5. **Error Scenarios**: Modify mock state to test error handling

## Troubleshooting

### Mock Mode Not Working

1. Verify localStorage is set:
   ```javascript
   console.log(localStorage.getItem('USE_MOCK_API'));
   ```
   Should return `"true"`

2. Hard refresh the page (Ctrl+F5 / Cmd+Shift+R)

3. Check browser console for errors

### Switching Between Modes

If you experience issues switching modes:
1. Clear localStorage completely
2. Close all browser tabs
3. Restart the application
4. Re-enable mock mode if needed

## Contributing

If you add new API methods, please also add corresponding mock implementations in `mockApiService.js` to ensure Mock Mode remains fully functional.
