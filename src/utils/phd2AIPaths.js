// Destinations come from native PHD2 status; users select existing inputs with
// the plugin file browser. Generated names work on both Windows and Linux.
export function aiOutputPath(directory, kind, identifier) {
  if (!directory || !['export', 'recording'].includes(kind)) {
    throw new Error('A PHD2 storage folder and output type are required');
  }
  const separator = directory.includes('\\') ? '\\' : '/';
  const extension = kind === 'export' ? 'json' : 'csv';
  return directory.replace(/[/\\]+$/, '') + separator + kind + '-' + identifier + '.' + extension;
}
