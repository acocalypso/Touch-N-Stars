# Native Celestia Atlas memory profiling

This protocol records repeatable native memory evidence for the embedded
Celestia Atlas. It complements functional Android/iOS hardware tests; it does
not replace them.

## Test scenario

Use a release-like native build connected to the selected N.I.N.A. plugin. Open
Celestia Atlas, wait for the catalogues, landscape, and photographic survey to
settle, then exercise this sequence for at least five minutes:

1. Pan in alternating directions and zoom across wide and narrow fields.
2. Search for and select a star, galaxy, nebula, and moving object.
3. Open and close target details, Settings, and About.
4. Use mount locate/follow and leave the survey settled after movement.
5. Hide/show the Atlas and background/foreground the application repeatedly.
6. Return to the initial field and leave the app settled for 30 seconds.

Record three runs on each release device class. Compare runs from the same
device and build; absolute memory values are not portable across operating
systems or devices.

## Android sampler

Requirements:

- `adb` available through `PATH` or the `ADB` environment variable;
- exactly one connected device, or pass `--serial`;
- `com.TouchNStars.dev` installed and running;
- Celestia Atlas open and settled before sampling begins.

Run the repeatable automated pan and lifecycle scenario:

```bash
npm run profile:android-atlas -- --duration-seconds 300 --interval-seconds 5
```

The default loop alternates horizontal and vertical pans, sends the app through
background/foreground once per minute, and stops input for the final 30 seconds
to measure settled recovery. To perform the complete scenario manually while
retaining identical memory sampling:

```bash
npm run profile:android-atlas -- --duration-seconds 300 --no-stress
```

Reports are written under `.cache/native-profile/` and contain the repository
commit at capture time, installed app version, device context, every sample,
process IDs, and settled summaries for total PSS, total RSS, private dirty
memory, native heap, Java heap, graphics, private-other, system, and code memory.
The sampler discovers the
isolated Chromium WebView renderer associated with the application and
aggregates it with the Capacitor host process; package-only `meminfo` would omit
most Atlas allocations. The first three samples are excluded from trend
calculations by default. Confirm separately that the installed native build was
produced from the recorded commit.

Android documents `dumpsys meminfo` as a point-in-time allocation snapshot and
recommends total PSS and private dirty memory as the primary process-weight
signals: [Android `dumpsys` documentation](https://developer.android.com/tools/dumpsys).

### Android interpretation

A usable run has no failed samples, no process restart, no missing WebView
process sample, and no low-memory kill.
After the warm-up, inspect:

- `settledGrowthKb`: median of the last window minus the first window;
- `slopeKbPerMinute`: least-squares trend across settled samples;
- `maxKb`: peak working-set evidence for package/device budgeting;
- native, Java, and graphics categories to identify the source of growth.

One positive slope is not sufficient to diagnose a leak: decoded survey caches,
WebView compilation, and graphics resources legitimately warm up. A suspected
leak is growth that repeats across equivalent cycles, does not level off after
the final settled interval, and reproduces in all three runs.

Emulator results validate the workflow but are not a physical-device release
baseline.

## iOS Instruments

iOS profiling requires macOS, Xcode, and the same physical device/build used for
functional testing. Apple provides `xctrace` for recording and exporting
Instruments traces; the exact templates available depend on the installed Xcode
version: [Apple Xcode command-line tool reference](https://developer.apple.com/documentation/xcode/xcode-command-line-tool-reference).

1. Connect the device and open the installed Touch'N'Stars application.
2. In Instruments, attach to `com.TouchNStars.dev` with **Allocations** and
   **VM Tracker**. Add **Leaks** for a diagnostic run.
3. Mark the start, each lifecycle cycle, and the final 30-second settled period.
4. Perform the same five-minute scenario used on Android.
5. Save the `.trace` outside the repository and export its summary tables.
6. Record persistent bytes, dirty memory, allocation count, peak footprint,
   leaks, and whether the process restarted or received a memory warning.

For command-line capture, first run `xcrun xctrace list devices` and
`xcrun xctrace list templates`, then use `man xctrace` from the installed Xcode
version to construct the `record` command. This avoids assuming a template name
or CLI option that differs between Xcode releases.

## Recording a release baseline

Do not commit raw traces or per-device JSON reports. Add a concise dated entry
to [celestia-atlas-migration.md](celestia-atlas-migration.md) containing:

- build commit, device model, OS version, and physical/emulator status;
- scenario duration, interval, and number of valid samples;
- first/last median, peak, settled growth, and slope for PSS/RSS or iOS
  footprint;
- native/Java/graphics or Allocations/VM category observations;
- process restarts, memory warnings, and leak findings;
- whether three comparable runs levelled off after the final settled interval.
