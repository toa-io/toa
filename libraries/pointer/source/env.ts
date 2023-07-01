export function nameVariable (...segments: string[]): string {
  return 'TOA_' + segments.join('_')
    .replaceAll(/[-.]/g, '_')
    .toUpperCase()
}
