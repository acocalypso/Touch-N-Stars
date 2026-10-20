# LuckyCapture UI

Mobile sections separate Preview, Camera and Recording. The pinned action bar
keeps Preview and Record/Stop accessible. Camera settings require paused
acquisition; recording limits can be prepared during preview.

Controls have 48 px minimum targets, 16 px input text, visible labels and inline
descriptions. Advanced controls and detailed statistics expand on demand.
The layout adapts to the available panel width and TNS navigation. Preview
preserves aspect ratio. Explicit ROI selection enables drawing; otherwise the
image permits scrolling and zooming. Coordinates are also editable numerically.

Chromium and WebKit checks passed at eight viewport sizes from 320x640 to
1440x900, including phone landscape and tablet. Checked overflow, targets,
labels, recording transitions, limits, stop, validation, ROI coordinates,
keyboard tabs and scrolling. Chromium mobile emulation also tested touch events
and the portrait navigation offset. Type checking, ESLint and build pass.

Browser flows use simulated camera responses. Pi deployment checks verify the
served production assets. Physical phone testing remains separate.

Design references: [WAI reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
and [Vue accessibility](https://vuejs.org/guide/best-practices/accessibility.html).
