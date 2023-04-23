'use strict'

const { letters: { up } } = require('@toa.io/generic')
const protocols = require('./protocols')

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @returns {toa.deployment.dependency.Variables}
 */
function deployment (instances) {
  /** @type {toa.deployment.dependency.Variables} */
  const variables = {}

  for (const { locator, manifest } of instances) {
    for (const [origin, reference] of Object.entries(manifest)) {
      const url = new URL(reference)

      if (protocols.includes(url.protocol)) {
        variables[locator.label] = secrets(locator, origin)
      }
    }
  }

  return variables
}

/**
 * @param {toa.core.Locator} locator
 * @param {string} origin
 * @return {toa.deployment.dependency.Variable[]}
 */
function secrets (locator, origin) {
  const properties = ['username', 'password']

  return properties.map((property) => secret(locator, origin, property))
}

/**
 * @param {toa.core.Locator} locator
 * @param {string} origin
 * @param {string} property
 * @return {toa.deployment.dependency.Variable}
 */
function secret (locator, origin, property) {
  const variable = `TOA_ORIGINS_${locator.uppercase}_${up(property)}`
  const secret = `toa-origins-${locator.label}-${property}`

  return {
    name: variable,
    secret: {
      name: secret,
      key: property
    }
  }
}

exports.deployment = deployment
