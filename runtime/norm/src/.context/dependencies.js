import { connectors, extensions, resolve } from './.dependencies/index.js'

export const dependencies = async (context) => {
  const { extensions: e, components, contributed } = await extensions(context)

  unmanaged(context, contributed)

  const c = connectors(context, components)
  const references = { ...c, ...e }

  return resolve(references, context.annotations, context)
}

/**
 * Marks as evicted what only evicted components require: the components an extension brings,
 * where nothing a deployment carries references the extension and no composition runs it. A
 * storage or a binding needs no mark of its own — its instances are components, and a
 * deployment reads theirs.
 *
 * @param {toa.norm.Context} context
 * @param {Map<string, toa.norm.Component[]>} contributed
 * @returns {void}
 */
function unmanaged(context, contributed) {
  const components = context.components ?? []

  if (!components.some((component) => component.evicted === true)) return

  const required = new Set()
  const pending = components.filter((component) => component.evicted !== true)

  // what a composition runs is deployed for being listed, whoever references it
  for (const composition of context.compositions ?? [])
    for (const reference of composition.services ?? [])
      pending.push(...(contributed.get(reference) ?? []))

  while (pending.length > 0) {
    const component = pending.pop()

    if (required.has(component)) continue

    required.add(component)

    for (const reference of Object.keys(component.extensions ?? {}))
      pending.push(...(contributed.get(reference) ?? []))
  }

  for (const brought of contributed.values())
    for (const component of brought) if (!required.has(component)) component.evicted = true
}
