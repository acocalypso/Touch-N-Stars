import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cameraFrameScreenRotationDeg,
  projectAngularExtent,
  projectEquatorial,
} from '@acocalypso/celestia-atlas';
import { computeMosaicPanelCenters } from '../mosaicPanels.js';
import { ATLAS_POSITION_ANGLE_CONVENTION } from '../positionAngle.js';

const DEG = Math.PI / 180;

// Mirrors the package's FOV overlay drawing: where does panel (column,row)
// land on a canvas of the given size for a view with rotation `viewRotationDeg`?
function drawnPanelPosition({ column, row, columns, rows, overlapPercent, fov, view, size }) {
  const focal = size / (2 * Math.tan((view.fovDeg * DEG) / 2));
  const panelWidth = projectAngularExtent(fov.widthDeg, focal);
  const panelHeight = projectAngularExtent(fov.heightDeg, focal);
  const overlap = overlapPercent / 100;
  const x = (column - (columns - 1) / 2) * panelWidth * (1 - overlap);
  const y = (row - (rows - 1) / 2) * panelHeight * (1 - overlap);
  const theta =
    cameraFrameScreenRotationDeg(
      view.rotationDeg,
      fov.positionAngleDeg,
      ATLAS_POSITION_ANGLE_CONVENTION,
      true
    ) * DEG;
  return {
    x: size / 2 + x * Math.cos(theta) - y * Math.sin(theta),
    y: size / 2 + x * Math.sin(theta) + y * Math.cos(theta),
  };
}

test('panel centres project onto the rectangles the package draws', () => {
  const size = 1200;
  const columns = 3;
  const rows = 2;
  const overlapPercent = 15;
  const fovs = [
    { widthDeg: 2, heightDeg: 1.3, positionAngleDeg: 0 },
    { widthDeg: 2, heightDeg: 1.3, positionAngleDeg: 40 },
    { widthDeg: 2, heightDeg: 1.3, positionAngleDeg: 200 },
  ];
  const centers = [
    { raDeg: 10, decDeg: 20 },
    { raDeg: 350, decDeg: 75 },
  ];
  for (const center of centers) {
    for (const fov of fovs) {
      const panels = computeMosaicPanelCenters({
        centerRaDeg: center.raDeg,
        centerDecDeg: center.decDeg,
        positionAngleDeg: fov.positionAngleDeg,
        fovWidthDeg: fov.widthDeg,
        fovHeightDeg: fov.heightDeg,
        columns,
        rows,
        overlapPercent,
      });
      assert.equal(panels.length, columns * rows);
      for (const viewRotationDeg of [0, 17, -75]) {
        const view = {
          center: { ...center, frame: 'J2000' },
          fovDeg: 8,
          rotationDeg: viewRotationDeg,
          mirrorX: true,
        };
        let index = 0;
        for (let row = 0; row < rows; row += 1) {
          for (let column = 0; column < columns; column += 1) {
            const panel = panels[index];
            index += 1;
            assert.equal(panel.label, `${column + 1}-${row + 1}`);
            assert.equal(panel.rotation, fov.positionAngleDeg);
            const projected = projectEquatorial(
              { raDeg: panel.ra, decDeg: panel.dec, frame: 'J2000' },
              view,
              size,
              size
            );
            const drawn = drawnPanelPosition({
              column,
              row,
              columns,
              rows,
              overlapPercent,
              fov,
              view,
              size,
            });
            assert.ok(
              Math.abs(projected.x - drawn.x) < 1e-6 && Math.abs(projected.y - drawn.y) < 1e-6,
              `panel ${panel.label} PA ${fov.positionAngleDeg} rot ${viewRotationDeg}: ` +
                `${projected.x},${projected.y} vs ${drawn.x},${drawn.y}`
            );
          }
        }
      }
    }
  }
});

test('matches the framing page small-angle formula (column 1 east, row 1 north)', () => {
  // Same maths as SaveFavTargets.computePanels(), which the framing page uses.
  function framingPanels({ ra, dec, rotation, fovX, fovY, cols, rows, overlap }) {
    const stepRa = fovX * (1 - overlap);
    const stepDec = fovY * (1 - overlap);
    const cosDec = Math.cos(dec * DEG);
    const cosT = Math.cos(rotation * DEG);
    const sinT = Math.sin(rotation * DEG);
    const panels = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const rawX = (col - (cols - 1) / 2) * stepRa;
        const rawY = (row - (rows - 1) / 2) * stepDec;
        const rotX = rawX * cosT + rawY * sinT;
        const rotY = -rawX * sinT + rawY * cosT;
        panels.push({ ra: ra - rotX / cosDec, dec: dec - rotY });
      }
    }
    return panels;
  }

  for (const rotation of [0, 35, 300]) {
    const atlas = computeMosaicPanelCenters({
      centerRaDeg: 83.8,
      centerDecDeg: -5.4,
      positionAngleDeg: rotation,
      fovWidthDeg: 0.5,
      fovHeightDeg: 0.35,
      columns: 2,
      rows: 2,
      overlapPercent: 10,
    });
    const framing = framingPanels({
      ra: 83.8,
      dec: -5.4,
      rotation,
      fovX: 0.5,
      fovY: 0.35,
      cols: 2,
      rows: 2,
      overlap: 0.1,
    });
    atlas.forEach((panel, index) => {
      assert.ok(Math.abs(panel.ra - framing[index].ra) < 1e-4, `ra ${panel.label} rot ${rotation}`);
      assert.ok(
        Math.abs(panel.dec - framing[index].dec) < 1e-4,
        `dec ${panel.label} rot ${rotation}`
      );
    });
  }
  // Sanity check on the labelling itself: column 1 has the larger RA (east).
  const atlas = computeMosaicPanelCenters({
    centerRaDeg: 83.8,
    centerDecDeg: -5.4,
    positionAngleDeg: 0,
    fovWidthDeg: 0.5,
    fovHeightDeg: 0.35,
    columns: 2,
    rows: 2,
    overlapPercent: 0,
  });
  assert.ok(atlas[0].ra > atlas[1].ra);
  assert.ok(atlas[0].dec > atlas[2].dec);
});

test('single panel sits on the centre and RA stays normalised', () => {
  const panels = computeMosaicPanelCenters({
    centerRaDeg: 359.9,
    centerDecDeg: 10,
    positionAngleDeg: 12,
    fovWidthDeg: 1,
    fovHeightDeg: 1,
    columns: 1,
    rows: 1,
    overlapPercent: 20,
  });
  assert.equal(panels.length, 1);
  assert.equal(panels[0].label, '1-1');
  assert.ok(Math.abs(panels[0].ra - 359.9) < 1e-9);
  assert.ok(Math.abs(panels[0].dec - 10) < 1e-9);

  const wrapped = computeMosaicPanelCenters({
    centerRaDeg: 359.9,
    centerDecDeg: 10,
    positionAngleDeg: 0,
    fovWidthDeg: 2,
    fovHeightDeg: 1,
    columns: 2,
    rows: 1,
    overlapPercent: 0,
  });
  for (const panel of wrapped) {
    assert.ok(panel.ra >= 0 && panel.ra < 360, `ra ${panel.ra}`);
  }
});

test('returns null for invalid input', () => {
  const valid = {
    centerRaDeg: 10,
    centerDecDeg: 20,
    positionAngleDeg: 0,
    fovWidthDeg: 2,
    fovHeightDeg: 1,
    columns: 2,
    rows: 2,
    overlapPercent: 10,
  };
  assert.notEqual(computeMosaicPanelCenters(valid), null);
  assert.equal(computeMosaicPanelCenters({ ...valid, centerRaDeg: Number.NaN }), null);
  assert.equal(computeMosaicPanelCenters({ ...valid, columns: 0 }), null);
  assert.equal(computeMosaicPanelCenters({ ...valid, rows: 1.5 }), null);
  assert.equal(computeMosaicPanelCenters({ ...valid, overlapPercent: 100 }), null);
  assert.equal(computeMosaicPanelCenters({ ...valid, fovWidthDeg: 0 }), null);
  assert.equal(computeMosaicPanelCenters({ ...valid, centerDecDeg: 91 }), null);
});
