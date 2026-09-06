import type { Parameter } from './Match.js'

export function segment(path: string): Segment[] {
  return fragment(path).map(parse)
}

export function fragment(path: string): string[] {
  const parts = path.split('/')

  // trailing slash
  if (parts[parts.length - 1] === '') parts.length--

  // leading slash
  return parts.splice(1)
}

function parse(segment: string): Segment {
  if (segment[0] === ':') return { fragment: null, placeholder: segment.substring(1) }
  else if (segment === '*') return { fragment: null, placeholder: null }
  else if (segment === '**') return { fragment: null, placeholder: null, wildcard: true }
  else return { fragment: segment }
}

export type Segment =
  | {
      fragment: string
    }
  | {
      fragment: null
      placeholder: string | null
      wildcard?: boolean
    }

/**
 * What a route template takes, by name. Describing has no values for them — a template is
 * not a path — and nothing that describes a method reads one. A `*` is skipped: it stands
 * for a segment the caller cannot name, so there is nothing to substitute.
 */
export function variables(segments: Segment[]): Parameter[] {
  const params: Parameter[] = []

  for (const segment of segments) {
    if (segment.fragment !== null) continue

    if (segment.wildcard === true) params.push({ name: '**', value: '' })
    else if (segment.placeholder !== null)
      params.push({ name: segment.placeholder, value: '' })
  }

  return params
}
