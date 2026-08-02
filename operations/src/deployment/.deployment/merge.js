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

  /** @type {toa.deployment.dependency.Probe | false | undefined} */
  let probe

  for (const dependency of dependencies) {
    if (dependency.references !== undefined) references.push(...dependency.references)
    if (dependency.services !== undefined) services.push(...dependency.services)
    if (dependency.proxies !== undefined) proxies.push(...dependency.proxies)
    if (dependency.variables !== undefined) append(variables, dependency.variables)
    if (dependency.mounts !== undefined) append(mounts, dependency.mounts)
    if (dependency.probe !== undefined) probe = dependency.probe
  }

  return { references, services, proxies, variables, mounts, probe }
}

const append = (merged, variables) => {
  for (const [component, vars] of Object.entries(variables)) {
    if (merged[component] === undefined) merged[component] = []

    merged[component].push(...vars)
  }
}

exports.merge = merge
