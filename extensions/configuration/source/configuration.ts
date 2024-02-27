import assert from 'node:assert'
import { type Locator } from '@toa.io/core'
import { decode, add } from '@toa.io/generic'
import * as schemas from '@toa.io/schemas'
import { PREFIX, SECRET_RX } from './deployment'
import { type Manifest } from './manifest'
import type { Schema } from '@toa.io/schemas'

export function get (locator: Locator, manifest: Manifest): Node {
  const values = getConfiguration(locator.uppercase)

  substituteSecrets(values)

  if (manifest.defaults !== undefined)
    add(values, manifest.defaults)

  const schema: Schema<any> = schemas.schema(manifest.schema)

  schema.validate(values)

  return values
}

function getConfiguration (suffix: string): Node {
  const variable = PREFIX + suffix
  const string = process.env[variable]

  if (string === undefined)
    return {}
  else
    return decode(string)
}

function substituteSecrets (configuration: Node): void {
  for (const [key, value] of Object.entries(configuration)) {
    if (typeof value === 'object' && value !== null)
      substituteSecrets(value as Node)

    if (typeof value !== 'string') continue

    const match = value.match(SECRET_RX)

    if (match === null) continue

    const name = match.groups?.variable

    assert.ok(name !== undefined)
    configuration[key] = getSecret(name)
  }
}

function getSecret (name: string): string {
  const variable = PREFIX + '_' + name
  const value = process.env[variable]

  if (value === undefined) throw new Error(`${variable} is not set.`)

  return value
}

export type Node = Record<string, unknown>
