import { type Locator } from '@toa.io/core'
import { add } from '@toa.io/generic'
import * as schemas from '@toa.io/schemas'
import { PREFIX, SECRET_RX } from './const.js'
import { Secret } from './Secret.js'
import type { Schema } from '@toa.io/schemas'
import type { Manifest } from './manifest.js'

/** The variable is set, so the values service is not consulted. */
export function overridden (locator: Locator): boolean {
  return process.env[PREFIX + locator.uppercase] !== undefined
}

/** The variable, the manifest defaults, then the schema. */
export function local (locator: Locator, manifest: Manifest): Node {
  const values = read(locator.uppercase)

  if (manifest.defaults !== undefined)
    add(values, manifest.defaults)

  return fit(values, manifest)
}

/** A copy of the value with the schema applied and the secrets substituted. */
export function fit (raw: object, manifest: Manifest): Node {
  // a copy of the caller's, and one of this realm: what came over the wire is JSON anyway
  const values = JSON.parse(JSON.stringify(raw)) as Node

  // the schema sees the references, which are the strings it declares
  validate(values, manifest)
  substituteSecrets(values)

  return values
}

function validate (values: Node, manifest: Manifest): void {
  const schema: Schema<any> = schemas.schema(manifest.schema)

  schema.validate(values)
}

function read (suffix: string): Node {
  const variable = PREFIX + suffix
  const string = process.env[variable]

  if (string === undefined)
    return {}
  else
    return JSON.parse(string)
}

function substituteSecrets (configuration: Node): void {
  for (const [key, value] of Object.entries(configuration)) {
    if (typeof value === 'object' && value !== null)
      substituteSecrets(value as Node)

    if (typeof value !== 'string') continue

    const match = value.match(SECRET_RX)

    if (match === null) continue

    const name = match.groups?.variable

    configuration[key] = new Secret(getSecret(name!))
  }
}

function getSecret (name: string): string {
  const variable = PREFIX + '_' + name
  const value = process.env[variable]

  if (value === undefined) throw new Error(`${variable} is not set.`)

  return value
}

export type Node = Record<string, unknown>
