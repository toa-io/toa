export function nameVariable (...segments: string[]): string {
  return segments.join('_')
    .replaceAll(/[-.]/g, '_')
    .toUpperCase()
}
