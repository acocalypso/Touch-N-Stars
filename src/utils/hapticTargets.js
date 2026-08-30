// Decides whether a clicked element deserves haptic feedback and how strong it
// should be. Kept free of DOM APIs so it can be unit tested under `node --test`
// (the test runner has no jsdom); `describeElement` is the only DOM adapter.

// Elements that count as "a thing you press". `.cursor-pointer` picks up the
// clickable rows and cards that are plain <div>/<li>; modal backdrops
// (@click.self="close") deliberately do not carry it and stay silent.
export const HAPTIC_SELECTOR = [
  'button',
  '[role="button"]',
  'a[href]',
  'label[for]',
  'select',
  '.nav-button',
  '[data-haptic]',
  '.cursor-pointer',
].join(', ');

// Design-system class for destructive/stopping actions (park, stop, abort).
// It matches the "medium" semantics of useHaptics one to one, so the stronger
// tap falls out of the styling instead of a per-button list.
const DANGER_CLASS = 'tns-btn-danger';

const INTERACTIVE_TAGS = new Set(['button', 'a', 'select', 'label']);

/**
 * @param {{ tag?: string, classes?: string[], dataHaptic?: string, disabled?: boolean, role?: string }} el
 * @returns {'light' | 'medium' | null} null means: do not vibrate.
 */
export function pickHapticStyle(el) {
  if (!el) return null;
  if (el.disabled) return null;

  // Explicit opt-out/opt-in always wins over any class-based guess.
  const explicit = el.dataHaptic;
  if (explicit === 'none') return null;
  if (explicit === 'medium' || explicit === 'light') return explicit;

  const classes = el.classes ?? [];
  if (classes.includes(DANGER_CLASS)) return 'medium';

  if (INTERACTIVE_TAGS.has(el.tag)) return 'light';
  if (el.role === 'button') return 'light';
  if (classes.includes('nav-button') || classes.includes('cursor-pointer')) return 'light';

  return null;
}

/** Flattens a DOM element into the plain shape `pickHapticStyle` expects. */
export function describeElement(el) {
  if (!el) return null;
  return {
    tag: el.tagName?.toLowerCase(),
    classes: Array.from(el.classList ?? []),
    dataHaptic: el.dataset?.haptic,
    disabled: el.disabled === true || el.getAttribute?.('aria-disabled') === 'true',
    role: el.getAttribute?.('role') ?? undefined,
  };
}
