# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [1.0.6.0] - unreleasd
### Added
- Focuser quick to use button
- Integrated iOS app
- Instanze Color -> There is a separate color for each instance. The navbar changes color depending on the instance
- add a plugin system
- A message is now displayed if the communication does not work

### Changed
- design rework stellarium 
- button design adjustment
- rewort guidegraph
- framing tab change reworked (!!! new api is needed !!! ) -> When starting TNS, the system now also switches back to the active tab of NINA

### Fixed
- repairs a connection error if the default port is not used
- the IP address in the plugin is now displayed correctly


## [1.0.5.0] - 2025-04-16
### Added
- Sequenceimage: Add download function
- Dome: Add Slew and Sync
- Add ToastModal 
- Focuser: Add autofocus graph 
- Camera: Add Chipsettings 
- Image History sorting by newest / oldest
- Stellarium Clock & Date view
- Altitude Chart in TargetSearch
- Settings for stretch factor and black clipping 
- Add Manuell Filterwheel controll. You have to set the filter wheel of the API

### Changed
- CaptureButton created and integrated into CameraView 
- CameraView is no longer locked when a sequence is running. Capturing only is not possible
- Manual Mountcontroll is permanently visible
- Update Eslint to 9
- add durations and dither to Guidegraph
- Sequence image is now displayed as in NINA

### Fixed
- Avoid duplicate NINA connection entries
- Eslint now fixes prettier
- Flatpanel icon state

## [1.0.4.4] - 2025-03-20
### Fixed
- fixed: add target to sequence

## [1.0.4.3] - 2025-03-29
### Fixed
- error fixed when sequence loads

## Android 1.6.3
### Added
- Implemented memory-safe APK updater with progress tracking
- Enhanced lifecycle handling for robust update management
- Integrated permission request handling for APK installation

### Fixed
- Resolved memory leak issues in the update checker
- Fixed access modifier conflict for `onDestroy()` override in `MainActivity`

### Changed
- Improved user feedback during APK downloads with a progress dialog
- Enhanced error handling for partial downloads and network failures

## [1.0.4.2] - 2025-03-28
### Fixed
- Fixed NINA Update

## [1.0.4.0] - 2025-03-28
### Added
- slew and Slew and Center added to stellarium
- settings panel for stellaruim added to activate different views
- Equipment: Device selection added
- Sequence editor
- Slew can now be canceled
- TPPA: Modal for bigger font size
- TPPA: Modal for target circel
- Framing wizard: Button slew to cenit
- Last sequence image cache
- SlewAndCenter with AzAlt
- Infomodal for slew and center

### Fixed
- fixes an error when the stellarium page is reloaded
- camera cooling status 

### Changed
- rework Stellarium mount position
- rework Stellarium selected object
- rework slew and slewAndCenter function
- Equipment connect page reworked
- Sequence info changed from json to state
- Hide the connection settings if it is not an Androidapp
- Manual mount control is only available if tracking is not active
- Last sequence image cache
- settings wizzard now loads the coordinates of nina
- imagehistory now loads thumbnails so it is much faster
- CenterHere: Rework Slwe and Centerbutton 

## [1.0.3.0] - 2025-03-08
### Added
- Stellarium Web Engine
- Display current mount position in stellarium
- Object selection in stellarium
- Framing assistent with stellarium data
- Date & Time selection in stellarium
- Image History

### Changed
- update cz
- rework history image

### Fixed
- Setup screen / Nina instance setup for Android only
- Windspeed in weather modal

## [1.0.2.2] - 2025-02-23
### Added
- Create a new SequenceImageHistory view that loads all the images from the history using the SequenceImage component.
- Add this new SequenceImageHistory view as a new tab of the "Sequence Monitoring" page.
- slew can be canceled
- set park position

### Changed
- Extract the sequence image loading logic into a new SequenceImage component. This component is in charge of displaying the image + stats + opening the modal for the full preview.

### Fixed
- Plugin null exception error
- Small UI fixes in the "Sequence Monitoring" page.
- Added a new script to add a new entry to all locale files. Very handy when creating a new entry to avoid going to all the files individually.
- TPPA fix display error

## [1.0.2.0] - 2025-02-21
### Added
- add flat assistant
- add manuell mount controll
- Starsearch
- spanish translation

### Changed
- Auto prepare for the images
- TPPA  shows more info
- DLSR chip size is loaded from the framing settings

### Fixed
- Loading the autofocus graphic after a run did not always work
- Shutdown / Restart now also works when PHD2 is running

## [1.0.1.0] - 2025-02-14
### Added
- Shutdown / Restart support (NINA PC)
- New Translation keys
- Manuell mount controll
- “center here” added
- image settings

### Changed
- Android framework replaced with CapacitorJS (previous App needs to be removed first)
- Android 10 is now required as min. version
- Images are processed in the same way as in NINA
- Camerapage layout reworked

### Fixed
- ISO was not set correctly with DLSR
- Pinia store now correctly stores Instance configurations

## [1.0.0.9] - 2025-02-07
### Added
- Graphic showing the remaining exposure time
- Binning can be set
- Readoutmode can be set
- Download Logs from Modal
- Klingon support

### Changed
- Camera design adjustments
- Save exposuretime gain and offset permanently
- prevent lockscreen on Android
- Load all values from Weather
- Logic of CORS in plugin changed
- Removed wshv and Autofocus watcher

### Fixed
- Flatpanel icon does not change color
- Guidergraph: Data was not always loaded
- Error when loading the target image fixed
- regular expression for dec and ra adapted
- Fixed custom sky survey cache path

### Known Issues
- Android - Logfile Download not working

## [1.0.0.8] - 2025-02-04
### Added
- Framingassistant
- Switchpage
- portuguese support
- Manuell mount control
- Guider notes
  
### Changed
- Filter wheel cannot be connected if it is manual
- Rotator cannot be connected if it is manual
- Camera and last sequence image is now in an Modal for zooming
- Adaptations to API version 2.1.7.0
- update cz, fr, it, de, en, cn
- Sequence overview reworked
- display of the zoom factor in the image modal 
  
### Fixed
- Camera - timeout
- Sequence image does not always load
- Weather modal
- Android Update
- Subnav
- Guider state management
- Guider RA / DEC values

## [1.0.0.7] - 2025-01-27
### Added
- Italian, Czech, Chinese support
- Weather modal with additional information
- About modal
- Updater for Android
- Cors description
  
### Fixed
- Input validation for Nina instances
- FQDN working again
- Instance selection
- TPPA state handling

## [1.0.0.6] - 2025-01-22
### Added
- Support for Advanced API 2.1.4.0
- Setup screen & Tutorial
- Proper guider implementation

### Fixed
- Ui Elements fixed

## [1.0.0.5] - 2025-01-19
### Added
- Flatpanel support
- Sequence monitor

### Fixed
- Mobile optimizations
- Navbar
