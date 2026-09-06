import path from 'node:path'

import { readFileSync } from 'node:fs'
import { yaml } from '@toa.io/generic'
import * as schemas from '@toa.io/schemas'

const object = yaml.load(
  readFileSync(path.resolve(import.meta.dirname, 'schema.yaml'), 'utf8')
)
const schema = schemas.schema(object)

export const validate = async (manifest) => {
  const error = schema.fit(manifest)

  if (error) throw error

  if (manifest.entity !== undefined) entity(manifest)
  if (manifest.events !== undefined) await events(manifest)
  if (manifest.receivers !== undefined) receivers(manifest)
}

/** What only the entity's own declaration can answer: whether a name it uses is one it declares. */
const entity = (manifest) => {
  const { properties, required, blank } = manifest.entity

  for (const name of required ?? [])
    if (properties[name] === undefined)
      throw new Error(`Entity requires property '${name}', which is not defined`)

  for (const name of Object.keys(blank ?? {}))
    if (properties[name] === undefined)
      throw new Error(`Entity blank names property '${name}', which is not defined`)
}

const events = async (manifest) => {
  for (const [label, event] of Object.entries(manifest.events)) {
    const { properties } = await import(event.binding)

    if (properties.async !== true) {
      throw new Error(`Event '${label}' binding '${event.binding}' is not async`)
    }
  }
}

const receivers = (manifest) => {
  for (const [locator, receiver] of Object.entries(manifest.receivers)) {
    if (manifest.operations?.[receiver.operation] === undefined) {
      throw new Error(
        `Receiver '${locator}' refers to undefined operation '${receiver.operation}'`
      )
    }

    if (!TYPES.has(manifest.operations[receiver.operation].type)) {
      throw new Error(
        `Receiver '${locator}' must refer to an operation of the allowed types: ${Array.from(TYPES).join(', ')}`
      )
    }
  }
}

const TYPES = new Set(['transition', 'assignment', 'effect', 'unmanaged'])
