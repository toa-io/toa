/**
 * Marks what the context evicts. An evicted component stays in the context like any other — it
 * is called, its types are written, what it receives is published — and only a deployment
 * leaves it out, because something else deploys it. What only evicted components require is
 * marked once the extensions are extracted, by `dependencies`.
 *
 * An evicted service is taken off the compositions that list it, so that none of them runs it.
 *
 * @param {toa.norm.Context} context
 * @returns {void}
 */
export const evict = (context) => {
  if (context.evicted === undefined) return

  const components = new Set(context.evicted.components ?? [])
  const services = new Set(context.evicted.services ?? [])

  if (components.size > 0) {
    const present = new Set(context.components.map((component) => component.locator.id))

    for (const id of components)
      if (!present.has(id))
        throw new Error(`'evicted' names an unknown component '${id}'.`)

    for (const component of context.components)
      if (components.has(component.locator.id)) component.evicted = true
  }

  if (context.compositions === undefined) return

  for (const composition of context.compositions) {
    if (composition.services === undefined) continue

    composition.services = composition.services.filter((reference) => !services.has(reference))

    if (composition.services.length === 0) delete composition.services
  }
}
