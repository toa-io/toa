'use strict'

/**
 * @param compositions {Array<toa.operations.deployment.Composition>}
 * @param dependency {toa.operations.deployment.Dependency}
 * @returns {toa.operations.deployment.Contents}
 */
const describe = (compositions, { references, services }) => {
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
    ...dependencies
  }
}

exports.describe = describe
