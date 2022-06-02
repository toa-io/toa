'use strict'

/**
 * Resolves component IDs within compositions with Component objects
 * @param {toa.formation.Context} context
 * @returns {void}
 */
const dereference = (context) => {
  const components = map(context.components)

  for (const composition of context.compositions) {
    composition.components = composition.components.map((id) => components[id])
  }
}

/**
 * @param {Array<toa.formation.Component>} components
 * @returns {toa.formation.component.Map}
 */
const map = (components) => {
  /** @type {toa.formation.component.Map} */
  const map = {}

  for (const component of components) map[component.locator.id] = component

  return map
}

exports.dereference = dereference
