'use strict'

const merge = (dependencies) => {
  /** @type {toa.deployment.dependency.Reference[]} */
  const references = []

  /** @type {toa.deployment.Service[]} */
  const services = []

  /** @type {toa.deployment.dependency.Proxy[]} */
  const proxies = []

  /** @type {toa.deployment.dependency.Variables} */
  const variables = {}

  const mounts = {}

  for (const dependency of dependencies) {
    if (dependency.references !== undefined) references.push(...dependency.references)
    if (dependency.services !== undefined) services.push(...dependency.services)
    if (dependency.proxies !== undefined) proxies.push(...dependency.proxies)
    if (dependency.variables !== undefined) append(variables, dependency.variables)
    if (dependency.mounts !== undefined) append(mounts, dependency.mounts)
  }

  return { references, services, proxies, variables, mounts }
}

const append = (merged, variables) => {
  for (const [component, vars] of Object.entries(variables)) {
    if (merged[component] === undefined) merged[component] = []

    merged[component].push(...vars)
  }
}

exports.merge = merge
