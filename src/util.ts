export function entriesToObject(entries: [key: string, value: any][]) {
  return entries.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}
