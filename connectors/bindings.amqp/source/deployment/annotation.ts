import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'

export function normalize (declaration: Declaration): Annotation {
  const annotation = expand(declaration)

  schema.validate(annotation)

  return annotation
}

function expand (declaration: Declaration): Annotation {
  if (typeof declaration === 'string') return { context: { '.': declaration } }

  const annotation: Annotation = { ...declaration }

  if (typeof annotation.context === 'string') annotation.context = { '.': annotation.context }

  return annotation
}

function loadSchema (): schemas.Schema {
  const path = resolve(__dirname, '../../schemas/annotation.cos.yaml')

  return schemas.schema(path)
}

const schema = loadSchema()

export interface Annotation {
  context: string | Record<string, string>
  sources?: Record<string, string>
}

export type Declaration = string | {
  context: string | Annotation['context']
  sources?: Annotation['sources']
}
