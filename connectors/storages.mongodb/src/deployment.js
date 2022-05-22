'use strict'

/**
 * @param values
 * @returns {toa.operations.deployment.Dependency}
 */
const deployment = (values) => {
  const domains = new Set(values.map((value) => value.domain))

  const references = [...domains].map((domain) => chart(domain))

  return { references }
}

/**
 * @param {string} domain
 * @returns {toa.operations.deployment.Reference}
 */
const chart = (domain) => {
  // TODO: use locator.host('mongo')
  const alias = domain + '-mongo'

  // TODO: credentials management
  const usernames = ['user']
  const passwords = ['password']
  const databases = [domain]

  return {
    name: 'mongodb',
    version: '12.0.0',
    repository: 'https://charts.bitnami.com/bitnami',
    alias,
    values: {
      architecture: 'standalone',
      fullnameOverride: alias,
      auth: {
        usernames,
        passwords,
        databases
      }
    }
  }
}

exports.deployment = deployment
