/**
 * Completes missing compositions with unused components
 * @param {toa.norm.Context} context
 * @returns {void}
 */
export const complete = (context) => {
  /** @type {Set<string>} */
  const composed = new Set()

  if (context.compositions === undefined) context.compositions = []

  // a composition every component of which is evicted is not deployed, and the name it held
  // is free again
  context.compositions = context.compositions.filter(
    (composition) => composition.components.length > 0
  )

  for (const composition of context.compositions) {
    for (const component of composition.components) {
      composed.add(component.locator.id)
    }
  }

  /** @type {Set<string>} */
  const names = new Set(context.compositions.map((composition) => composition.name))

  for (const component of context.components) {
    const { id, label: name } = component.locator

    if (composed.has(id)) continue
    if (names.has(name)) throw new Error(`Duplicate composition name '${name}'`)

    context.compositions.push({ name, components: [component] })
  }
}
