import * as pointer from '@toa.io/pointer'
import { type URIMap } from '@toa.io/pointer'

export function normalize (declaration: Declaration): Annotation {
  const annotation = expand(declaration)
  const context = pointer.normalize(annotation.context)
  const sources = pointer.normalize(annotation.sources)

  return { context, sources }
}

function expand (declaration: string | Declaration): Declaration {
  if (typeof declaration === 'string') return { context: { '.': [declaration] } }
  else if (Array.isArray(declaration)) return { context: { '.': declaration } }
  else return declaration
}

export interface Annotation {
  context: URIMap
  sources?: URIMap
}

export interface Declaration {
  context: string | URIMap
  sources?: URIMap
}
