export function segment (path: string): Segment[] {
  return fragment(path).map(parse)
}

export function fragment (path: string): string[] {
  const parts = path.split('/')

  // trailing slash
  if (parts[parts.length - 1] === '') parts.length--

  // leading slash
  return parts.splice(1)
}

function parse (segment: string): Segment {
  if (segment[0] === ':') return { fragment: null, placeholder: segment.substring(1) }
  else if (segment === '*') return { fragment: null, placeholder: null }
  else return { fragment: segment }
}

export type Segment = {
  fragment: string
} | {
  fragment: null
  placeholder: string | null
}
