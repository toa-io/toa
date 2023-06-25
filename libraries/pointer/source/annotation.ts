import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import type { Annotation } from './Deployment'

export function normalize (declaration: Declaration): Annotation {
  const annotation: Annotation = {}

  if (typeof declaration === 'string' || Array.isArray(declaration))
    declaration = { '.': declaration }

  for (const [key, value] of Object.entries(declaration))
    if (typeof value === 'string') annotation[key] = [value]
    else annotation[key] = value

  validate(annotation)

  return annotation
}

function validate (annotation: Annotation): void {
  schema.validate(annotation)

  for (const uris of Object.values(annotation))
    for (const uri of uris)
      checkCredentials(uri)
}

function checkCredentials (uri: string): void {
  const url = new URL(uri)

  if (url.username !== '' || url.password !== '')
    throw new Error(`Pointer URI '${uri}' must not contain credentials.`)
}

const path = resolve(__dirname, '../schemas/annotation.cos.yaml')
const schema = schemas.schema(path)

export type Declaration = string | string[] | Record<string, string | string[]>
