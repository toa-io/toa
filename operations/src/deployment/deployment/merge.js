'use strict'

/**
 * @param {toa.operations.deployment.Dependency[]} dependencies
 * @returns {toa.operations.deployment.Dependency | Object}
 */
const merge = (dependencies) => {
  /** @type {toa.operations.deployment.Reference[]} */
  const references = []
  /** @type {toa.operations.deployment.Service[]} */
  const services = []

  for (const dependency of dependencies) {
    if (dependency.references !== undefined) references.push(...dependency.references)
    if (dependency.services !== undefined) services.push(...dependency.services)
  }

  return { references, services }
}

exports.merge = merge
