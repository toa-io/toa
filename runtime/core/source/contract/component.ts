import { pack, same, unpack } from './system.ts'
import type { Definition, Entity } from './request.ts'
import type { JSONSchema } from './schemas.ts'

/** What a caller is given in order to call a component: what a map states of it. */
export interface Contract {
  /** the version of the component this describes */
  version?: string

  /** what carries a call to any of its operations, which one of them may name otherwise */
  bindings?: string[]
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
 *
 * What the runtime gives every component is not stated either, or is stated once: the entity's
 * system properties, the bindings an operation did not name, the empty output an operation
 * declaring none normalises to, and the `query` that follows from a scope of `none`. None of it
 * is a declaration, and `restore` is what puts it back for whoever reads one.
 */
export function component(manifest: Contract): Contract {
  const contract: Contract = { version: manifest.version }

  if (manifest.bindings !== undefined) contract.bindings = manifest.bindings

  if (manifest.entity !== undefined) {
    const entity: Entity = { properties: manifest.entity.properties }

    if (manifest.entity.required !== undefined) entity.required = manifest.entity.required

    contract.entity = pack(entity)
  }

  if (manifest.operations !== undefined) {
    contract.operations = {}

    for (const [endpoint, definition] of Object.entries(manifest.operations))
      contract.operations[endpoint] = operation(definition, manifest.bindings)
  }

  if (manifest.events !== undefined) {
    contract.events = {}

    for (const [event, definition] of Object.entries(manifest.events))
      contract.events[event] = { binding: definition.binding }
  }

  return contract
}

/**
 * The contract as the component declared it, which is the whole of what a caller is held to.
 * What was never left out passes through: a component's own manifest is a contract too, and is
 * what a receiver is given of the component whose events it receives.
 */
export function restore(contract: Contract): Contract {
  const restored: Contract = { ...contract }

  if (contract.entity !== undefined) restored.entity = unpack(contract.entity)

  if (contract.operations !== undefined) {
    restored.operations = {}

    for (const [endpoint, definition] of Object.entries(contract.operations))
      restored.operations[endpoint] = declared(definition, contract.bindings)
  }

  return restored
}

function operation(definition: Operation, bindings?: string[]): Operation {
  const operation: Record<string, unknown> = {}

  for (const key of KEYS) {
    const value = definition[key]

    if (value === undefined) continue
    if (key === 'bindings' && same(value, bindings)) continue
    if (key === 'output' && describes(value as JSONSchema | null) === false) continue
    if (key === 'query' && value === false && definition.scope === 'none') continue

    operation[key] = value
  }

  return operation as Operation
}

function declared(definition: Operation, bindings?: string[]): Operation {
  const operation: Operation = { ...definition }

  operation.bindings ??= bindings

  if (operation.scope === 'none') operation.query ??= false

  return operation
}

/** Whether a schema says anything, which the one an operation declaring no output gets does not. */
function describes(schema: JSONSchema | null): boolean {
  return schema !== null && Object.keys(schema).length > 0
}

/** What a call to an operation is addressed by, carries, answers and refuses with. */
const KEYS = [
  'type',
  'scope',
  'query',
  'once',
  'stateful',
  'stream',
  'bindings',
  'description',
  'input',
  'output',
  'errors'
] as const satisfies Array<keyof Operation>
