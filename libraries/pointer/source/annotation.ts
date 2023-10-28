import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import { shards } from '@toa.io/generic'
import type { URIMap } from './Deployment'

export function normalize (declaration: Declaration): URIMap {
  const map: URIMap = {}

  if (declaration === undefined) return map

  if (typeof declaration === 'string' || Array.isArray(declaration))
    declaration = { '.': declaration }

  for (const [key, value] of Object.entries(declaration))
    if (typeof value === 'string') map[key] = format([value])
    else map[key] = format(value)

  validate(map)

  return map
}

function format (values: string[]): string[] {
  return values.map(shards).flat()
}

function validate (map: URIMap): void {
  schema.validate(map)

  for (const uris of Object.values(map))
    for (const uri of uris)
      checkCredentials(uri)
}

function checkCredentials (uri: string): void {
  const url = new URL(uri)

  if (url.username !== '' || url.password !== '')
    throw new Error(`Pointer URI '${uri}' must not contain credentials. ` +
      'Please refer to the "Credentials" section in the documentation for more information.')
}

const path = resolve(__dirname, '../schemas/urimap.cos.yaml')
const schema = schemas.schema(path)

export type Declaration = string | string[] | Record<string, string | string[]> | undefined
