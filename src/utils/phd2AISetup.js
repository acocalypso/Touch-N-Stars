// Derive the assistant from native PHD2 state, so reopening the page resumes
// a running job without trusting a browser-stored wizard position.
export const AI_SETUP_STEPS = ['prepare', 'train', 'review', 'shadow', 'active'];

export function aiSetupOverview(status, guiding, requestedDuration = 1800) {
  const training = status?.training ?? {};
  const recording = training.state === 'recording';
  const fitting = training.state === 'fitting';
  const running = Boolean(training.running || recording || fitting);
  let step = guiding ? 'train' : 'prepare';
  if (running) step = 'train';
  else if (status?.model_loaded) {
    step = status.mode === 'active' ? 'active' : status.mode === 'shadow' ? 'shadow' : 'review';
  }
  const duration = Math.max(0, Number(running ? training.duration_sec : requestedDuration) || 0);
  const elapsed = Math.max(0, Number(training.elapsed_sec) || 0);
  return {
    step,
    index: AI_SETUP_STEPS.indexOf(step),
    recording,
    fitting,
    running,
    duration,
    remaining: recording ? Math.max(0, duration - elapsed) : null,
    progress: recording && duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0,
    canTest: Boolean(status?.model_loaded && status?.fingerprint_ok && guiding && !running),
  };
}
