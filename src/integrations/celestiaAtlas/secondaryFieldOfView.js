// The celestia-atlas package draws its single FOV frame centered on the
// canvas, always at (width/2, height/2), using its internal projectionView
// (view.fovDeg for scale, plus rotationDeg/mirrorX from alignViewToHorizon in
// horizontal mode). All of that math is exported, so a second, independently
// styled frame can be computed the same way from outside the package without
// forking it. See docs/features/platesolve-camera-rotation.md.
import {
  alignViewToHorizon,
  cameraFrameScreenRotationDeg,
  projectAngularExtent,
} from '@acocalypso/celestia-atlas';
import { ATLAS_POSITION_ANGLE_CONVENTION } from './positionAngle.js';

export function computeSecondaryFieldOfViewFrame({
  view,
  observer,
  coordinateMode,
  utcMs,
  widthDeg,
  heightDeg,
  angleDeg,
  containerWidth,
}) {
  if (
    !view ||
    !Number.isFinite(view.fovDeg) ||
    !Number.isFinite(widthDeg) ||
    !Number.isFinite(heightDeg) ||
    !Number.isFinite(angleDeg) ||
    !Number.isFinite(containerWidth) ||
    containerWidth <= 0
  ) {
    return null;
  }

  const projectionView =
    coordinateMode === 'horizontal' && observer ? alignViewToHorizon(view, observer, utcMs) : view;

  const scale = containerWidth / (2 * Math.tan((view.fovDeg * Math.PI) / 360));
  const panelWidth = projectAngularExtent(widthDeg, scale);
  const panelHeight = projectAngularExtent(heightDeg, scale);
  const screenRotationDeg = cameraFrameScreenRotationDeg(
    projectionView.rotationDeg ?? 0,
    angleDeg,
    ATLAS_POSITION_ANGLE_CONVENTION,
    Boolean(projectionView.mirrorX)
  );

  return { panelWidth, panelHeight, screenRotationDeg };
}
