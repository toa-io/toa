'use strict'

const get = require('./.describe')

/**
 * @param {toa.norm.Context} context
 * @param {toa.deployment.Composition[]} compositions
 * @param {toa.deployment.Dependency} dependency
 * @returns {toa.deployment.Contents}
 */
const describe = (context, compositions, dependency) => {
  const { references, services, proxies } = dependency

  const components = get.components(compositions)
  const dependencies = get.dependencies(references)
  const variables = get.variables(context, dependency.variables)

  return {
    compositions,
    components,
    services,
    proxies,
    variables,
    ...dependencies
  }
}

exports.describe = describe
