export function segment (path: string): string[] {
  return path.substring(1).split('/')
}
