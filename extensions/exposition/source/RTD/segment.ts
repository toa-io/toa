export function segment (path: string): Segments {
  return path.substring(1)
    .split('/')
    .filter((segment) => segment !== '')
    .map(nullify)
}

function nullify (segment: string): string | null {
  return segment[0] === ':' ? null : segment
}

export type Segments = Array<string | null>
