'use strict'

/**
 * @param {toa.deployment.Composition[]} compositions
 * @returns {string[]}
 */
const components = (compositions) => {
  /** @type {Set<string>} */
  const components = new Set()

  for (const composition of compositions) {
    for (const component of composition.components) {
      components.add(component)
    }
  }

  return Array.from(components)
}

exports.components = components
