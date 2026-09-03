import path from 'node:path'

import { readFileSync } from 'node:fs'
import { load as parseYAML } from 'js-yaml'
import * as schemas from '@toa.io/schemas'

const object = parseYAML(readFileSync(path.resolve(import.meta.dirname, 'schema.yaml'), 'utf8'))
const schema = schemas.schema(object)

export const validate = async (manifest) => {
  const error = schema.fit(manifest)

  if (error) throw error

  if (manifest.events !== undefined) await events(manifest)
  if (manifest.receivers !== undefined) receivers(manifest)
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
      throw new Error(`Receiver '${locator}' refers to undefined operation '${receiver.operation}'`)
    }

    if (!TYPES.has(manifest.operations[receiver.operation].type)) {
      throw new Error(`Receiver '${locator}' must refer to an operation of the allowed types: ${Array.from(TYPES).join(', ')}`)
    }
  }
}

const TYPES = new Set(['transition', 'assignment', 'effect', 'unmanaged'])
