'use strict'

/**
 * @param {toa.formation.component.Brief[]} components
 * @returns {toa.operations.deployment.Dependency}
 */
const deployment = (components) => {
  const domains = new Set()
  const references = []

  for (const component of components) {
    if (domains.has(component.locator.domain)) continue

    references.push(chart(component))
    domains.add(component.locator.domain)
  }

  return { references }
}

/**
 * @param {toa.formation.component.Brief} component
 * @returns {toa.operations.deployment.Reference}
 */
const chart = (component) => {
  const alias = component.locator.host('storage', 0)

  return {
    name: 'mongodb',
    version: '12.0.0',
    repository: 'https://charts.bitnami.com/bitnami',
    alias,
    values: {
      architecture: 'standalone',
      fullnameOverride: alias,
      auth: {
        enabled: false
      }
    }
  }
}

exports.deployment = deployment
