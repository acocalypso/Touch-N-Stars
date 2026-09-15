// Computes the sky coordinates of every mosaic panel centre exactly where the
// celestia-atlas package draws them. The package positions panels on the
// canvas (see its FOV overlay: translate to the centre, rotate by
// cameraFrameScreenRotationDeg, offset each panel by column/row step) and all
// of that projection math is exported, so instead of deriving a spherical
// formula the same steps are replayed on a synthetic view and unprojected back
// to RA/Dec. Whatever the package renders is therefore what gets saved.
//
// The atlas always runs in horizontal mode, i.e. mirrorX = true (sky view,
// east on the left). The panel set is symmetric, so mirroring only affects
// which panel is labelled column 1: with mirrorX = true column 1 is the
// eastern-most and row 1 the northern-most panel — the same labelling the
// framing page uses in SaveFavTargets.computePanels().
import {
  cameraFrameScreenRotationDeg,
  projectAngularExtent,
  unprojectEquatorial,
} from '@acocalypso/celestia-atlas';
import { ATLAS_POSITION_ANGLE_CONVENTION } from './positionAngle.js';
import { toAtlasCoordinates } from './contracts.js';

// Any synthetic view works because panel offsets are expressed in canvas
// pixels and unprojected with the same focal length; 90° over 2000 px gives
// focal = 1000 px, comfortably inside floating point precision.
const SYNTHETIC_FOV_DEG = 90;
const SYNTHETIC_SIZE_PX = 2000;

export function computeMosaicPanelCenters({
  centerRaDeg,
  centerDecDeg,
  positionAngleDeg,
  fovWidthDeg,
  fovHeightDeg,
  columns,
  rows,
  overlapPercent,
}) {
  if (
    !Number.isFinite(centerRaDeg) ||
    !Number.isFinite(centerDecDeg) ||
    !Number.isFinite(positionAngleDeg) ||
    !Number.isFinite(fovWidthDeg) ||
    !Number.isFinite(fovHeightDeg) ||
    !Number.isInteger(columns) ||
    !Number.isInteger(rows) ||
    !Number.isFinite(overlapPercent) ||
    columns < 1 ||
    rows < 1 ||
    overlapPercent < 0 ||
    overlapPercent >= 100 ||
    fovWidthDeg <= 0 ||
    fovWidthDeg >= 180 ||
    fovHeightDeg <= 0 ||
    fovHeightDeg >= 180
  ) {
    return null;
  }

  let center;
  try {
    center = toAtlasCoordinates({ raDeg: centerRaDeg, decDeg: centerDecDeg, frame: 'J2000' });
  } catch {
    return null;
  }

  const view = { center, fovDeg: SYNTHETIC_FOV_DEG, rotationDeg: 0, mirrorX: true };
  const focal = SYNTHETIC_SIZE_PX / (2 * Math.tan((SYNTHETIC_FOV_DEG * Math.PI) / 360));
  const panelWidth = projectAngularExtent(fovWidthDeg, focal);
  const panelHeight = projectAngularExtent(fovHeightDeg, focal);
  const overlap = overlapPercent / 100;
  const stepX = panelWidth * (1 - overlap);
  const stepY = panelHeight * (1 - overlap);
  const screenRotation =
    (cameraFrameScreenRotationDeg(0, positionAngleDeg, ATLAS_POSITION_ANGLE_CONVENTION, true) *
      Math.PI) /
    180;
  const cosR = Math.cos(screenRotation);
  const sinR = Math.sin(screenRotation);
  const half = SYNTHETIC_SIZE_PX / 2;

  const panels = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = (column - (columns - 1) / 2) * stepX;
      const y = (row - (rows - 1) / 2) * stepY;
      // Canvas rotate() is applied before the offset, so rotate the offset
      // the same way the package does.
      const screenX = x * cosR - y * sinR;
      const screenY = x * sinR + y * cosR;
      const coordinates = unprojectEquatorial(
        half + screenX,
        half + screenY,
        view,
        SYNTHETIC_SIZE_PX,
        SYNTHETIC_SIZE_PX
      );
      panels.push({
        label: `${column + 1}-${row + 1}`,
        ra: coordinates.raDeg,
        dec: coordinates.decDeg,
        rotation: positionAngleDeg,
      });
    }
  }
  return panels;
}
