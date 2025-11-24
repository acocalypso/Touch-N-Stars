# Shortcuts Plugin for Touch'N'Stars

Plugin that allows creating shortcuts to quickly load and execute N.I.N.A sequences.

## Features

- 🚀 Quick loading of sequences via custom buttons
- ▶️ Optional automatic sequence start after loading
- 🎨 Customization with icons and colors
- 📱 Intuitive and responsive interface
- 💾 Local configuration storage

## Installation

This plugin is automatically installed with Touch'N'Stars. No additional installation required.

## Usage

### Creating a new shortcut

1. Open the "Shortcuts" plugin from the plugins menu
2. Click "New Shortcut"
3. Fill in the fields:
   - **Shortcut Name**: A descriptive name (e.g., "M31 Session")
   - **Sequence File**: Select the N.I.N.A sequence to load
   - **Auto-start**: Enable this option if you want the sequence to start automatically
   - **Icon**: Select an emoji to visually identify the shortcut
   - **Color**: Choose a button color
4. Click "Create"

### Using a shortcut

Simply click the shortcut button. This will:
1. Load the associated sequence in N.I.N.A
2. If auto-start is enabled, start the sequence immediately

### Editing a shortcut

1. Tap the menu (three dots) on the shortcut card and choose **Edit**
2. Modify the desired fields
3. Click "Update"

### Deleting a shortcut

1. Tap the menu (three dots) on the shortcut card and choose **Delete**
2. Confirm the deletion in the dialog

## N.I.N.A APIs Used

This plugin uses the following N.I.N.A APIs:

### List available sequences
```javascript
GET /v2/api/sequence/list-available
```
Returns the list of sequence files (.json) available in N.I.N.A.

### Load a sequence
```javascript
GET /v2/api/sequence/load?sequenceName=<filename.json>
```
Loads a specific sequence in N.I.N.A.

### Start sequence
```javascript
GET /v2/api/sequence/start?skipValidation=true
```
Starts the currently loaded sequence.

## Storage

Shortcuts are stored locally using the N.I.N.A configuration API:

```javascript
Key: 'shortcuts_list'
Value: JSON with shortcuts array
```

Each shortcut has the following structure:
```javascript
{
  id: string,           // Unique UUID
  phrase: string,       // Shortcut name
  sequenceFile: string, // Sequence filename
  autoStart: boolean,   // Whether to start automatically
  icon: string,         // Icon emoji
  color: string         // Button color (hex)
}
```

## Requirements

- Touch'N'Stars v1.0.0 or higher
- N.I.N.A with API plugin enabled
- N.I.N.A with Touch'N'Stars plugin enabled

## Troubleshooting

### No available sequences shown

1. Verify that N.I.N.A is running
2. Verify that N.I.N.A's API plugin is enabled
3. Verify that you have saved sequences in N.I.N.A
4. Click "Refresh list" to reload sequences

### Sequence won't load

1. Verify that the sequence file still exists in N.I.N.A
2. Verify the connection with N.I.N.A
3. Check N.I.N.A logs for more details

### Auto-start doesn't work

1. Verify that the sequence loaded correctly
2. Make sure the sequence is valid and has no errors
3. Verify that no confirmation modal dialog is open in N.I.N.A

## Development

### File structure

```
plugins/shortcuts/
├── index.js                    # Plugin entry point
├── plugin.json                 # Plugin metadata
├── README.md                   # This file
├── components/
│   ├── ShortcutButton.vue     # Individual shortcut button
│   ├── ShortcutEditor.vue     # Editor to create/edit shortcuts
│   └── ShortcutsList.vue      # List of shortcuts
├── store/
│   └── shortcutsStore.js      # Pinia store for state management
└── views/
    └── ShortcutsView.vue      # Main plugin view
```

### Adding new features

To extend the plugin:

1. **Add fields**: Modify `shortcutsStore.js` to include new fields in shortcuts
2. **Custom UI**: Edit `ShortcutButton.vue` or `ShortcutEditor.vue`
3. **New actions**: Add methods in the store and connect them with N.I.N.A APIs

## License

This plugin is part of Touch'N'Stars and is subject to the same license.

## Credits

Developed for Touch'N'Stars - Remote control for N.I.N.A (Nighttime Imaging 'N' Astronomy)
