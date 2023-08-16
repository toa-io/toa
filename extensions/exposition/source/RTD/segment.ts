export function segment (path: string): Segment[] {
  return fragmet(path).map(parse)
}

export function fragmet (path: string): string[] {
  const parts = path.split('/')

  if (parts[parts.length - 1] === '') parts.length--

  // leading slash
  return parts.splice(1)
}

function parse (segment: string): Segment {
  if (segment[0] === ':') return { fragment: null, placeholder: segment.substring(1) }
  else return { fragment: segment }
}

export type Segment = {
  fragment: string
} | {
  fragment: null
  placeholder: string
}
