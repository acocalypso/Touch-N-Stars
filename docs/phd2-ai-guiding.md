# AI guiding in Touch-N-Stars

The panel is under **Guider -> Settings -> AI guiding**, after connecting PHD2.
It works with Windows NINA and PINS through the Touch-N-Stars plugin HTTP API.
It feature-detects AI RPC support instead of assuming all PHD2 versions have it.
The plugin needs the changes documented in its `PHD2_AI_API.md`, and PHD2 needs
the native AI build. No training terminal or Python process is required.

The panel shows the current PHD2 profile, selected model, fingerprint warnings,
confidence and native training status. Its model dropdown uses that profile's
library. It provides training/start/cancel, gain and Disabled/Shadow/Active,
model import/export/unload, CSV fitting and recording controls. Training keeps
running on PHD2 if the page is closed. Status polling runs only while the panel
is mounted. Connection changes discard old replies and model selections.

## Test on the installed Pi

1. Start SkySimulator on the Windows PC, with Alpaca enabled. The Pi currently
   uses `192.168.178.31:11111`, guide camera 1 and telescope 0.
2. Open http://192.168.178.109:5000 and hard-refresh the browser.
3. On Equipment, connect the SkySimulator mount first, then PHD2. The separate
   **SkySimulator Alpaca AI Test** PHD2 profile is already selected. Confirm the
   actual guide focal length (the new profile starts at 200 mm) before calibration.
4. Point the simulator near Dec 0, start looping, select a star and calibrate.
   Keep periodic error zero for this initial connection/calibration check.
5. Add RA sinusoidal periodic error in SkySimulator: period **300 s**, amplitude
   **5 arcsec**. Initially keep noise, DEC error, polar error and backlash zero.
   Start normal guiding using RA Hysteresis, stable exposure/binning and optics.
6. Open Guider -> Settings -> AI guiding. Set duration **1800 s**, period **300 s**,
   and Start training. Check increasing frame count, then Complete with a model.
7. Select Shadow, Apply and observe confidence over several cycles. Set gain
   **0.10**, choose Active and Apply; compare equal-duration guiding intervals.
   Disable AI restores ordinary guiding assistance immediately.
8. Expand Models and recordings to inspect the Pi's model/CSV paths. Import and
   export use paths on the Pi. CSV fitting also requires its adjacent `.csv.json`
   metadata. New model selection and PHD2 restart leave AI disabled.

For a short functional test, set simulator period **30 s**, amplitude **5 arcsec**,
and duration **180 s**. This is a synthetic software check; use a realistic mount
period for meaningful guiding comparisons. Training needs at least two cycles
and enough valid frames; six cycles are recommended.

The isolated built-in Simulator integration test has already verified the Pi's
native training, Shadow and bounded RA Active through the plugin API. It does
not prove improvement with a physical mount or real seeing. PHD2's
`doc/AI_GUIDING_PI.md` explains how to repeat it and restore the original image.

## Frontend validation

```bash
npm ci
npm run lint
npm run typecheck
npm run test:run
npm run i18n:check
npm run build:app
```

On a 4 GB Pi, use `NODE_OPTIONS=--max-old-space-size=3072` for typecheck. Linux
test loading is scoped to the actual application `src` directory, so dependency
JSON remains readable even if the repository itself lives under a `src` folder.
The atlas dependency lock uses HTTPS and the same pinned commit as the manifest.
