'use strict'

/**
 * Resolves component IDs within compositions with Component objects
 * @param {toa.norm.Context} context
 * @returns {void}
 */
const dereference = (context) => {
  const components = map(context.components)

  if (context.compositions !== undefined) {
    for (const composition of context.compositions) {
      composition.components = composition.components.map((id) => components[id])
    }
  }
}

/**
 * @param {Array<toa.norm.Component>} components
 * @returns {toa.norm.component.Map}
 */
const map = (components) => {
  /** @type {toa.norm.component.Map} */
  const map = {}

  for (const component of components) map[component.locator.id] = component

  return map
}

exports.dereference = dereference
