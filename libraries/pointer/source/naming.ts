export function nameVariable (...segments: string[]): string {
  return 'TOA_' + segments.join('_')
    .replaceAll(/[-.]/g, '_')
    .toUpperCase()
}

export function nameSecret (...segments: string[]): string {
  return 'toa-' + segments.join('-')
    .replaceAll('.', '-')
    .replace(/--$/, '.default')
}
