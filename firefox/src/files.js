export function fileName(name) {
  const clean = String(name).split(/[\\/]/).pop().replace(/[<>:"|?*\x00-\x1f]/g, '_').trim();
  return clean ? (/\.ts$/i.test(clean) ? clean : clean + '.ts') : 'untitled.ts';
}
export function uniqueName(name, existing) {
  const clean = fileName(name);
  const dot = clean.lastIndexOf('.');
  let candidate = clean, n = 2;
  while (existing.includes(candidate)) candidate = clean.slice(0, dot) + ` (${n++})` + clean.slice(dot);
  return candidate;
}
export function hasContent(files) {
  return files.some(file => file.model.getValue().length > 0);
}
