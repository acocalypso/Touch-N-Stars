// Decides whether a clicked element deserves haptic feedback and how strong it
// should be. Kept free of DOM APIs so it can be unit tested under `node --test`
// (the test runner has no jsdom); `describeElement` is the only DOM adapter.

// Only controls that actually do something get a tap: buttons, the toggles and
// checkboxes that change a setting, and the navigation entries. Clickable rows
// and cards, labels, plain links and <select> pickers stay silent.
export const HAPTIC_SELECTOR = [
  'button',
  '[role="button"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  '.nav-button',
  '[data-haptic]',
].join(', ');

// Design-system class for destructive/stopping actions (park, stop, abort).
// It matches the "medium" semantics of useHaptics one to one, so the stronger
// tap falls out of the styling instead of a per-button list.
const DANGER_CLASS = 'tns-btn-danger';

const CHECKABLE_TYPES = new Set(['checkbox', 'radio']);

/**
 * @param {{ tag?: string, type?: string, classes?: string[], dataHaptic?: string,
 *   disabled?: boolean, role?: string }} el
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

  if (el.tag === 'button') return 'light';
  if (el.tag === 'input' && CHECKABLE_TYPES.has(el.type)) return 'light';
  if (el.role === 'button') return 'light';
  if (classes.includes('nav-button')) return 'light';

  return null;
}

/** Flattens a DOM element into the plain shape `pickHapticStyle` expects. */
export function describeElement(el) {
  if (!el) return null;
  return {
    tag: el.tagName?.toLowerCase(),
    type: el.type,
    classes: Array.from(el.classList ?? []),
    dataHaptic: el.dataset?.haptic,
    disabled: el.disabled === true || el.getAttribute?.('aria-disabled') === 'true',
    role: el.getAttribute?.('role') ?? undefined,
  };
}
