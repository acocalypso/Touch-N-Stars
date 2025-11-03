# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0.0] [App3.x.x] - 2025-xx-xx
### Add
- **App**
  - Add dialog modal with component-based architecture for different dialog types:
    - `DefaultDialog.vue` - Standard text dialogs
    - `PlateSolvingDialog.vue` - Plate solving status with parameters and results table
    - `ManualRotatorDialog.vue` - Rotator position control with clock visualization
    - `TppaPage.vue` - Three-Point Polar Alignment dialog integrated in modal
  - TPPA dialog now displays in modal window instead of separate page
  - Stop button in TPPA alignment automatically closes dialog window
  - Improved z-index layering for Mount Controls modal overlay in TPPA dialog
  - Refactored `DialogModal.vue` into separate, focused components for better maintainability
- **Plugin**
  - Major refactoring Separated monolithic `Controller.cs` (2800+ lines) into separate, focused controller classes:
    - `AutofocusController` - Autofocus control endpoints
    - `DialogController` - Dialog management endpoints
    - `FavoritesController` - Favorites management
    - `MessageBoxController` - TNS MessageBox control
    - `PHD2Controller` - PHD2 guiding endpoints (1796+ lines)
    - `SettingsController` - Settings management
    - `SystemController` - System control (shutdown/restart)
    - `TelescopiusController` - Telescopius PIAAPI proxy
    - `TargetSearchController` - NGC search and target pictures
    - `UtilityController` - Logs, version, and API port endpoints
  - Server registration: Updated `TouchNStarsServer.cs` to register all controllers with EmbedIO
  - Dialog Manager: Complete rewrite of dialog message formatting and state management
  - Code organization: Moved controllers to `Controllers/` subdirectory, services to `Services/`, models to `Models/`, and infrastructure to `Infrastructure/`

  ### Fixed
- Plugin
  - Dialog box state management and confirmation workflow
  - Message formatting in dialog manager
  - API response handling consistency across all endpoints

### Improved
- Plugin
  - Code maintainability through separation of concerns
  - API endpoint organization and discoverability
  - Error handling and logging across all controllers
  - API responses now return English messages for consistency

