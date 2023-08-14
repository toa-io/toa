import { type Locator } from '@toa.io/core'
import { decode, add } from '@toa.io/generic'
import * as schemas from '@toa.io/schemas'
import { PREFIX, SECRET_RX } from './deployment'
import { type Manifest } from './manifest'

export function get (locator: Locator, manifest: Manifest): Configuration {
  const values = getConfiguration(locator.uppercase)

  substituteSecrets(values)

  if (manifest.defaults !== undefined) add(values, manifest.defaults)

  const schema = schemas.schema(manifest.schema)

  schema.validate(values)

  return values
}

function getConfiguration (suffix: string): Configuration {
  const variable = PREFIX + suffix
  const string = process.env[variable]

  if (string === undefined) return {}
  else return decode(string)
}

function substituteSecrets (configuration: Configuration): void {
  for (const [key, value] of Object.entries(configuration)) {
    if (typeof value !== 'string') continue

    const match = value.match(SECRET_RX)

    if (match === null) continue

    const name = match.groups?.variable as string

    configuration[key] = getSecret(name)
  }
}

function getSecret (name: string): string {
  const variable = PREFIX + '_' + name
  const value = process.env[variable]

  if (value === undefined) throw new Error(`${variable} is not set.`)

  return value
}

export type Configuration = Record<string, any>
