# Touch-N-Stars: A Comprehensive Overview of Features

Touch-N-Stars is a mobile control client for NINA (Nighttime Imaging 'N' Astronomy) and PINS/headless astrophotography rigs. It offers tools for remotely configuring equipment and managing imaging sessions from browsers, tablets, and phones.

## Core Functionality & Integration

*   **Mobile Rig Control**: Control and configure NINA or PINS profiles directly from a tablet or smartphone.
*   **Celestia Atlas Integration**: Offline sky visualization and catalogue search with target selection, framing handoff, mount/FOV overlays, horizon and landscape support, independent brightness limits, and persisted deep-sky type/source marker filters.
*   **Comprehensive Equipment Management**: Manage various astronomical equipment, including:
    *   **Camera Control**: Detailed control over camera settings and operations.
    *   **Mount Control**: Precise control over telescope mounts.
    *   **Focuser Control**: Fine-tune focus for optimal imaging.
    *   **Guiding Control**: Advanced guiding functionalities to ensure accurate tracking.
    *   **Dome Control**: Manage observatory domes.
    *   **Filter Wheel Control**: Control filter wheels for various imaging needs.
    *   **Rotator Control**: Manage astronomical rotators.
    *   **Switch Control**: Control various switches and power outlets.

## Advanced Imaging & Alignment Features

*   **Sequence Management**: Create, edit, and monitor imaging sequences with real-time monitoring capabilities.
*   **Flat Assistant**: Tools to assist with flat frame acquisition.
*   **Flat Device Control**: Control dedicated flat field devices.
*   **Three Point Polar Alignment (TPPA)**: Dedicated tools for precise polar alignment.
*   **Framing**: Functionality for framing targets within the field of view.

## User Experience & Utility Features

*   **Intuitive User Interface**: Optimized for mobile devices, ensuring ease of use during setup and capture initiation.
*   **Streamlined Navigation**: Easy-to-use navigation system throughout the application.
*   **Settings Management**: Comprehensive general and specific settings for complete customization.
*   **Profile Management**: Manage and switch between different equipment and imaging profiles.
*   **Notifications**: Intelligent system for managing and displaying important notifications.
*   **Status Display**: Real-time display of equipment and session status.
*   **Weather Monitoring**: Integration for monitoring weather conditions.
*   **Built-in Tutorials**: Interactive tutorials to guide users through features and setup.
*   **Favorite Targets**: Manage and quickly access your favorite astronomical targets.
*   **Setup Wizard**: A cancellable first-run and equipment wizard covering language, rig connection, mount, location, telescope, camera, focuser, and filter wheel. PINS first reads and configures the host locale, Wi-Fi country, timezone, and keyboard layout from searchable host-supported lists, then adds Wi-Fi, updates, INDI slew-rate, guiding, and third-party INDI-driver installation steps. The live regional settings can also be changed later under General Settings.

## Prerequisites

*   Standard Windows mode requires a running NINA installation with current Touch-N-Stars and Advanced API plugins; Advanced API V2 must be enabled and its port is discovered dynamically.
*   PINS/headless mode uses the PINS backend plus Pinsdaemon for system-management features.
