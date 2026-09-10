/**
 * Drops what the context evicts, before anything is derived from what is left: an extension,
 * a storage or a binding only an evicted component declared is then never resolved either.
 *
 * A composition left with no components of its own is dropped later, by `complete`: what it
 * listed as a service is pulled in by its being listed, and a service that has to fall back
 * to a deployment of its own has to exist to fall back at all.
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

    context.components = context.components.filter(
      (component) => !components.has(component.locator.id)
    )
  }

  if (context.compositions === undefined) return

  for (const composition of context.compositions) {
    // the members are still ids: this runs before they are dereferenced
    composition.components = composition.components.filter((id) => !components.has(id))

    if (composition.services !== undefined) {
      composition.services = composition.services.filter(
        (reference) => !services.has(reference)
      )

      if (composition.services.length === 0) delete composition.services
    }
  }
}
