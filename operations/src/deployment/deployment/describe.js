'use strict'

/**
 * @param {toa.formation.Context} context
 * @param {toa.operations.deployment.Composition[]} compositions
 * @param {toa.operations.deployment.Dependency} dependency
 * @returns {toa.operations.deployment.Contents}
 */
const describe = ({ environment }, compositions, { references, services }) => {
  /** @type {Set<string>} */
  const components = new Set()

  for (const composition of compositions) {
    for (const component of composition.components) {
      components.add(component)
    }
  }

  const dependencies = references?.reduce((map, reference) => {
    const { name, alias, values } = reference

    map[alias || name] = values

    return map
  }, {})

  return {
    compositions,
    components: Array.from(components),
    services,
    environment,
    ...dependencies
  }
}

exports.describe = describe
