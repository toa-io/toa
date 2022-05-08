'use strict'

/**
 * Resolves component IDs within compositions with Component objects
 * @param context {toa.formation.context.Context}
 * @returns {void}
 */
const dereference = (context) => {
  const components = map(context.components)

  for (const composition of context.compositions) {
    composition.components = composition.components.map((id) => components[id])
  }
}

/**
 * @param components {Array<toa.formation.component.Component>}
 * @returns {toa.formation.component.Map}
 */
const map = (components) => {
  /** @type {toa.formation.component.Map} */
  const map = {}

  for (const component of components) map[component.locator.id] = component

  return map
}

exports.dereference = dereference
