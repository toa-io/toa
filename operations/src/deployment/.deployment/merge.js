'use strict'

/**
 * @param {toa.operations.deployment.Dependency[]} dependencies
 * @returns {toa.operations.deployment.Dependency | Object}
 */
const merge = (dependencies) => {
  /** @type {toa.operations.deployment.dependency.Reference[]} */
  const references = []

  /** @type {toa.operations.deployment.Service[]} */
  const services = []

  /** @type {toa.operations.deployment.dependency.Proxy[]} */
  const proxies = []

  /** @type {toa.operations.deployment.dependency.Variables} */
  const variables = {}

  for (const dependency of dependencies) {
    if (dependency.references !== undefined) references.push(...dependency.references)
    if (dependency.services !== undefined) services.push(...dependency.services)
    if (dependency.proxies !== undefined) proxies.push(...dependency.proxies)
    if (dependency.variables !== undefined) append(variables, dependency.variables)
  }

  return { references, services, proxies, variables }
}

/**
 * @param {toa.operations.deployment.dependency.Variables} merged
 * @param {toa.operations.deployment.dependency.Variables} variables
 */
const append = (merged, variables) => {
  for (const [component, vars] of Object.entries(variables)) {
    if (merged[component] === undefined) merged[component] = []

    merged[component].push(...vars)
  }
}

exports.merge = merge
