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

  for (const dependency of dependencies) {
    if (dependency.references !== undefined) references.push(...dependency.references)
    if (dependency.services !== undefined) services.push(...dependency.services)
    if (dependency.proxies !== undefined) proxies.push(...dependency.proxies)
  }

  return { references, services, proxies }
}

exports.merge = merge
