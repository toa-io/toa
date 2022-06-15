'use strict'

/**
 * @param dependencies {Array<toa.operations.deployment.Dependency>}
 * @returns {toa.operations.deployment.Dependency}
 */
const merge = (dependencies) => {
  /** @type {Array<toa.operations.deployment.Reference>} */
  const references = []
  /** @type {Array<toa.operations.deployment.Service>} */
  const services = []

  for (const dependency of dependencies) {
    if (dependency.references !== undefined) references.push(...dependency.references)
    if (dependency.services !== undefined) services.push(...dependency.services)
  }

  return { references, services }
}

exports.merge = merge
