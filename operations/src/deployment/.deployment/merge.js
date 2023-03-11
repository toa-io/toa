'use strict'

/**
 * @param {toa.deployment.Dependency[]} dependencies
 * @returns {toa.deployment.Dependency}
 */
const merge = (dependencies) => {
  /** @type {toa.deployment.dependency.Reference[]} */
  const references = []

  /** @type {toa.deployment.Service[]} */
  const services = []

  /** @type {toa.deployment.dependency.Proxy[]} */
  const proxies = []

  /** @type {toa.deployment.dependency.Variables} */
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
 * @param {toa.deployment.dependency.Variables} merged
 * @param {toa.deployment.dependency.Variables} variables
 */
const append = (merged, variables) => {
  for (const [component, vars] of Object.entries(variables)) {
    if (merged[component] === undefined) merged[component] = []

    merged[component].push(...vars)
  }
}

exports.merge = merge
