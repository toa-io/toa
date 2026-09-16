import path from 'node:path'

import { readFileSync } from 'node:fs'
import { yaml } from '@toa.io/generic'
import * as schemas from '@toa.io/schemas'
import { definition } from '../definition.js'

const object = yaml.load(
  readFileSync(path.resolve(import.meta.dirname, 'schema.yaml'), 'utf8')
)
const schema = schemas.schema(object)

export const validate = async (manifest) => {
  const error = schema.fit(manifest)

  if (error) throw error

  if (manifest.entity !== undefined) entity(manifest)
  if (manifest.operations !== undefined) await streams(manifest)
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

/**
 * An operation that takes a stream is reachable over a binding that carries one. A binding that
 * declares none is served in this process alone, which is a component saying so.
 */
const streams = async (manifest) => {
  for (const [endpoint, operation] of Object.entries(manifest.operations)) {
    if (operation.stream === undefined || operation.bindings.length === 0) continue
    if (await carried(operation.bindings)) continue

    throw new Error(`Operation '${endpoint}' takes a stream, which none of its bindings carries`)
  }
}

/** Whether any of these bindings carries a call whose input holds a stream. */
const carried = async (bindings) => {
  for (const binding of bindings)
    if ((await definition(binding)).module.properties.streams === true) return true

  return false
}

const events = async (manifest) => {
  for (const [label, event] of Object.entries(manifest.events)) {
    const { properties } = (await definition(event.binding)).module

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
