# AI guiding in Touch-N-Stars

The panel is under **Guider -> Settings -> AI guiding**, after connecting PHD2.
It works with Windows NINA and PINS through the Touch-N-Stars plugin HTTP API.
It feature-detects AI RPC support instead of assuming all PHD2 versions have it.
The plugin needs the changes documented in its `PHD2_AI_API.md`, and PHD2 needs
the native AI build. No training terminal or Python process is required.

The settings page has separate **General** and **AI guiding** tabs. The AI setup assistant follows preparation, training, model review, Shadow testing and Active monitoring. It shows recording progress, frame count and estimated recording time remaining from PHD2; fitting time is reported as unknown. Leaving the tab does not cancel training. The assistant enables Active only after an explicit click, with prediction gain 0.10. Shadow observation and model RMS do not automatically certify an improvement.

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

## Settings assistant validation (2026-10-06)

Windows and Raspberry Pi production builds passed, with 612 frontend tests.
Browser checks on the installed Pi covered General/AI tab separation, keyboard
navigation, a 390-pixel mobile viewport, live training countdown/frame count,
and the native Shadow/Active phases. The isolated built-in PHD2 simulator
trained on 79 frames, produced 20 Shadow frames with zero AI correction and
36 Active frames with bounded RA correction (maximum 0.0508 px), with zero DEC
AI contribution. The main SkySimulator profile was restored, stopped and with
AI disabled; its calibration and guiding were not changed by this test.
