import { remap } from '@toa.io/generic'

/**
 * What a caller is given in order to call a component, of what its normalised manifest holds.
 *
 * What a component states about serving a call rather than about making one is its own: an
 * operation's concurrency, the bridge that runs it and what it forwards to, and the entity's
 * storage, its blank and its migrations. An event's `path` is a path in the process that
 * normalised the manifest, and names nothing in any other.
 *
 * @param {toa.norm.Component} component
 * @returns {toa.norm.Contract}
 */
export const contract = (component) => {
  /** @type {toa.norm.Contract} */
  const contract = { version: component.version }

  if (component.entity !== undefined)
    contract.entity = {
      properties: component.entity.properties,
      required: component.entity.required
    }

  if (component.operations !== undefined)
    contract.operations = remap(component.operations, operation)

  if (component.events !== undefined)
    contract.events = remap(component.events, (event) => ({ binding: event.binding }))

  return contract
}

/**
 * @param {toa.norm.component.Operation} definition
 * @returns {toa.norm.component.Operation}
 */
const operation = (definition) => {
  const operation = {}

  for (const key of KEYS) if (definition[key] !== undefined) operation[key] = definition[key]

  return operation
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
]
