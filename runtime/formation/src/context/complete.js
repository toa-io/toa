'use strict'

/**
 * Completes missing compositions with unused components
 * @param context {toa.formation.context.Context}
 * @returns {void}
 */
const complete = (context) => {
  /** @type {Set<string>} */
  const composed = new Set()

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

exports.complete = complete
