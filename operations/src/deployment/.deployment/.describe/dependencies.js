'use strict'

/**
 * @param {toa.deployment.dependency.Reference[]} references
 * @returns {*}
 */
const dependencies = (references) => {
  return references?.reduce((map, reference) => {
    const { name, alias, values } = reference

    map[alias || name] = values

    return map
  }, {})
}


exports.dependencies = dependencies
