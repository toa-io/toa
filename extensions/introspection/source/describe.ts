import type { Node, Operation, Event, Receiver } from './model'
import type { Manifest } from '@toa.io/norm'

/**
 * Turns a normalized component manifest into the node of the map.
 *
 * Everything here is already expanded by norm: concise schemas are resolved and
 * the prototype chain is collapsed, so this is the shape the runtime actually runs.
 */
export function describe (manifest: Manifest): Node {
  return {
    namespace: manifest.namespace,
    component: manifest.name,
    version: manifest.version,
    entity: entity(manifest),
    operations: operations(manifest),
    events: events(manifest),
    receivers: receivers(manifest),

    // names only: extension declarations carry configuration and secrets
    extensions: Object.keys(manifest.extensions ?? {})
  }
}

function entity (manifest: Manifest): Node['entity'] {
  if (manifest.entity === undefined)
    return null

  return {
    schema: manifest.entity.schema,
    storage: manifest.entity.storage,
    associated: manifest.entity.associated === true
  }
}

function operations (manifest: Manifest): Operation[] {
  return Object.entries(manifest.operations ?? {})
    .map(([endpoint, definition]: [string, any]) => ({
      endpoint,
      type: definition.type,
      scope: definition.scope,
      query: definition.query,
      input: definition.input ?? null,
      output: definition.output ?? null,
      errors: definition.errors ?? []
    }))
}

function events (manifest: Manifest): Event[] {
  return Object.entries(manifest.events ?? {})
    .map(([label, definition]: [string, any]) => ({ label, binding: definition.binding }))
}

/*
 * Receiver labels contain dots (`identity.bans.created`), which is why nodes keep
 * these as arrays rather than maps — a dot in a document key is a hazard in Mongo.
 */
function receivers (manifest: Manifest): Receiver[] {
  return Object.entries(manifest.receivers ?? {})
    .map(([label, definition]: [string, any]) => ({
      label,
      source: definition.source ?? label.split('.').slice(0, 2).join('.'),
      event: label.split('.').pop()!,
      operation: definition.operation,
      conditioned: definition.conditioned === true,
      adaptive: definition.adaptive === true
    }))
}
