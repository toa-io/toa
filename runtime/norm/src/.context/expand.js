import * as shortcuts from '../shortcuts.js'

/**
 * @param {toa.norm.context.Declaration | object} context
 */
export const expand = (context) => {
  shortcuts.recognize(shortcuts.SHORTCUTS, context, 'annotations')
  shortcuts.recognize(shortcuts.SHORTCUTS, context.annotations)

  // a composition names a service the way a manifest names an extension, and everything
  // downstream matches it against a dependency, which is keyed by package reference
  for (const composition of context.compositions ?? [])
    if (composition.services !== undefined)
      composition.services = composition.services.map(shortcuts.resolve)

  if (context.evicted?.services !== undefined)
    context.evicted.services = context.evicted.services.map(shortcuts.resolve)

  // a component that declares no namespace is written by its name, and is known by its id
  for (const composition of context.compositions ?? [])
    if (Array.isArray(composition.components))
      composition.components = composition.components.map((id) => complete(id, 2))

  if (Array.isArray(context.evicted?.components))
    context.evicted.components = context.evicted.components.map((id) => complete(id, 2))

  if (Array.isArray(context.events))
    context.events = context.events.map((event) => complete(event, 3))
}

/**
 * `name` is `default.name` where an id has two segments, `name.event` is `default.name.event`
 * where it has three. Anything else is left for the schema to refuse as it is written.
 *
 * @param {unknown} id
 * @param {number} segments how many a complete one has
 */
function complete(id, segments) {
  if (typeof id !== 'string' || id.split('.').length !== segments - 1) return id

  return `${NAMESPACE}.${id}`
}

/** Where a component that declares no namespace is. */
const NAMESPACE = 'default'
