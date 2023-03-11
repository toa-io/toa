'use strict'

/**
 * @param {toa.norm.Context} context
 * @returns {toa.norm.context.dependencies.References}
 */
const extensions = (context) => {
  /** @type {toa.norm.context.dependencies.References} */
  const extensions = {}

  for (const component of context.components) {
    if (component.extensions !== undefined) {
      for (const reference of Object.keys(component.extensions)) {
        if (extensions[reference] === undefined) extensions[reference] = []

        extensions[reference].push(component)
      }
    }
  }

  return extensions
}

exports.extensions = extensions
