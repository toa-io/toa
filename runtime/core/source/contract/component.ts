import type { Definition, Entity } from './request.ts'

/** What a caller is given in order to call a component: what a map states of it. */
export interface Contract {
  /** the version of the component this describes */
  version?: string
  entity?: Entity
  operations?: Record<string, Operation>
  events?: Record<string, Event>
}

export interface Operation extends Definition {
  bindings?: string[]
}

export interface Event {
  binding: string
}

/**
 * What a caller is given of a component, of what its normalised manifest holds.
 *
 * What a component states about serving a call rather than about making one is its own: an
 * operation's concurrency, the bridge that runs it and what it forwards to, and the entity's
 * storage, its blank and its migrations. An event's `path` is a path in the process that
 * normalised the manifest, and names nothing in any other.
 */
export function component(manifest: Contract): Contract {
  const contract: Contract = { version: manifest.version }

  if (manifest.entity !== undefined)
    contract.entity = {
      properties: manifest.entity.properties,
      required: manifest.entity.required
    }

  if (manifest.operations !== undefined) {
    contract.operations = {}

    for (const [endpoint, definition] of Object.entries(manifest.operations))
      contract.operations[endpoint] = operation(definition)
  }

  if (manifest.events !== undefined) {
    contract.events = {}

    for (const [event, definition] of Object.entries(manifest.events))
      contract.events[event] = { binding: definition.binding }
  }

  return contract
}

function operation(definition: Operation): Operation {
  const operation: Record<string, unknown> = {}

  for (const key of KEYS)
    if (definition[key] !== undefined) operation[key] = definition[key]

  return operation as Operation
}

/** What a call to an operation is addressed by, carries, answers and refuses with. */
const KEYS = [
  'type',
  'scope',
  'query',
  'once',
  'stateful',
  'bindings',
  'description',
  'input',
  'output',
  'errors'
] as const satisfies Array<keyof Operation>
