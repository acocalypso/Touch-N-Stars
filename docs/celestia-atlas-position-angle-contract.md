# Celestia Atlas position-angle contract

This document is the required provenance record for every image-derived angle
that can reach Celestia Atlas framing. New FITS, WCS, plate-solve, or image
metadata must be added here and converted at the typed host boundary before it
may update `framingStore.rotationAngle`.

## Canonical host convention

- Unit: decimal degrees.
- Range: `[0, 360)` after Euclidean normalization.
- Zero: the camera frame is aligned with celestial north.
- Positive direction: N.I.N.A. sky `PositionAngle`, represented by the Atlas
  public API as `clockwise-from-celestial-north`.
- Coordinate basis: the frame center is J2000 at the N.I.N.A. command boundary.
- Invalid, absent, boolean, or non-finite values are rejected; they are never
  replaced with an invented zero-degree result.

`src/integrations/celestiaAtlas/positionAngle.js` owns normalization and source
conversion. The Atlas view imports the same canonical convention constant, so
the producer and renderer cannot independently choose a sign convention.

## Applied sources

| Host workflow                                    | Upstream value                                                                                            | Upstream convention                                                                      | Host conversion             | Provenance                                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Determine rotation from the live camera          | `PlateSolveResult.PositionAngle` from the Advanced API snapshot/plate-solve response                      | N.I.N.A. sky position angle in degrees                                                   | Validate and normalize only | `cameraStore.getCameraRotation()` calls `positionAngleFromNinaPlateSolve()`                                                                     |
| FITS analysis when the file has no usable WCS    | Touch-N-Stars plugin `FitsSolveResult.Rotation`, populated from N.I.N.A. `PlateSolveResult.PositionAngle` | N.I.N.A. sky position angle in degrees                                                   | Validate and normalize only | `/api/fits/analyze` returns `SolvedFromWcs=false`; `FitsPlateSolve.vue` calls `positionAngleFromFitsAnalysis()`                                 |
| FITS analysis when the file already contains WCS | Touch-N-Stars plugin `FitsSolveResult.Rotation`, populated from N.I.N.A. `WorldCoordinateSystem.Rotation` | N.I.N.A. WCS/image rotation in degrees; it is the inverse of N.I.N.A. sky position angle | `(360 - Rotation) mod 360`  | `/api/fits/analyze` returns `SolvedFromWcs=true`; `FitsPlateSolve.vue` preserves that discriminator and calls `positionAngleFromFitsAnalysis()` |

The FITS endpoint's single `Rotation` JSON property therefore has two source
conventions. `SolvedFromWcs` is mandatory provenance, not display-only data.
Dropping it would reintroduce the sign error for already-solved FITS files.

## Sources that do not update Atlas framing

- FITS `FOCALLEN`, `XPIXSZ`, binning, RA, Dec, and object-coordinate headers are
  optical or pointing hints; none is treated as a position angle.
- The Advanced API image response can expose a plate-solve `Orientation`, but
  Touch-N-Stars does not copy that field into Atlas framing.
- Framing-cache target previews provide pixels only. They do not provide or
  override camera rotation.
- `settingsStore.currentImageRotation` rotates the Camera page preview in
  90-degree display steps. It is an instance-specific UI transform, not a sky
  position angle.
- Manual Atlas/Framing Assistant edits, favourite rotation, mosaic-panel
  rotation, and sequence target rotation are host/user-owned values already in
  the canonical N.I.N.A. position-angle convention. They are not inferred from
  FITS or image metadata.
- Rotator mechanical position and the 10Micron polar position-angle diagnostic
  are equipment values and never feed `framingStore.rotationAngle` implicitly.

## WCS parity limitation

N.I.N.A. derives `WorldCoordinateSystem.Rotation` from the FITS CD matrix or
`CROTA2`/`CDELT` values, detects a one-axis parity flip, and adjusts rotation
before exposing it. Its source explicitly defines:

```text
PositionAngle = EuclidianModulus(360 - Rotation, 360)
```

N.I.N.A. also documents in that implementation that images flipped on both
axes are not supported. The Touch-N-Stars FITS response does not expose the
`Flipped` flag, so the host trusts N.I.N.A.'s parsed `Rotation` and cannot infer
additional parity. Supporting a new WCS parser or double-axis parity case
requires a new provenance discriminator and reference fixture; it must not be
folded into the existing two source identifiers.

## Primary-source record

The contract was audited on 2026-07-22 against:

- N.I.N.A. `develop` revision
  [`b66bb14249a63b0bc5c9813ac26727a4265ea887`](https://github.com/isbeorn/nina/tree/b66bb14249a63b0bc5c9813ac26727a4265ea887),
  especially
  [`WorldCoordinateSystem.cs`](https://github.com/isbeorn/nina/blob/b66bb14249a63b0bc5c9813ac26727a4265ea887/NINA.Astrometry/WorldCoordinateSystem.cs)
  and
  [`FramingAssistantVM.cs`](https://github.com/isbeorn/nina/blob/b66bb14249a63b0bc5c9813ac26727a4265ea887/NINA/ViewModel/FramingAssistant/FramingAssistantVM.cs).
- Touch-N-Stars N.I.N.A. plugin revision
  [`ac51901ad2e4ff68ff05bd61a60702a7e05897b7`](https://github.com/acocalypso/N.I.N.A-Plugin-for-Touch-N-Stars/tree/ac51901ad2e4ff68ff05bd61a60702a7e05897b7),
  especially
  [`FitsAnalysisController.cs`](https://github.com/acocalypso/N.I.N.A-Plugin-for-Touch-N-Stars/blob/ac51901ad2e4ff68ff05bd61a60702a7e05897b7/Touch-N-Stars/Server/Controllers/FitsAnalysisController.cs).
- Advanced API revision
  `024987d4126877257e352738ccb4f511e4569ac9`, whose framing and image endpoints
  forward N.I.N.A. `PositionAngle` without defining a separate sky convention.

Context7 identified `/isbeorn/nina` as the high-reputation upstream package but
did not return the angle definitions for the focused query. The pinned primary
source above is therefore authoritative for this boundary.

## Admission checklist for a new source

Before another value can update framing rotation, its change must include:

1. Producer, endpoint/property, unit, range, zero direction, positive direction,
   celestial frame, image-axis definition, and parity behavior in this document.
2. A distinct source identifier and conversion in `positionAngle.js`; generic
   pass-through is not allowed.
3. Reference tests for zero, wraparound, sign, invalid values, and any parity or
   mirrored-image case.
4. A source-routing assertion proving the consumer uses the provenance boundary
   instead of assigning raw metadata to `framingStore.rotationAngle`.
5. Visual confirmation at PA 0 and one non-zero PA in both Framing Assistant and
   Celestia Atlas before release.
