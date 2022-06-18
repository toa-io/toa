'use strict'

/**
 * @param {toa.formation.Context} context
 * @param {toa.operations.deployment.Composition[]} compositions
 * @param {toa.operations.deployment.Dependency} declaration
 * @returns {toa.operations.deployment.Contents | Object}
 */
const describe = ({ environment }, compositions, declaration) => {
  const { references, services, proxies } = declaration

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
    proxies,
    environment,
    ...dependencies
  }
}

exports.describe = describe
