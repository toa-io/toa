'use strict'

const { letters: { up } } = require('@toa.io/libraries/generic')

/**
 * @param {toa.norm.context.dependencies.Instance} instance
 * @param {URL} url
 * @param {string} suffix
 */
const variables = (instance, url, suffix) => {
  const prefix = `TOA_${up(suffix)}_${instance.locator.uppercase}_`
  const scope = `toa-${suffix}-${instance.locator.label}`

  const variables = PROPERTIES
    .filter(([property]) => url[property] !== '')
    .map(([property, coercion]) => ({
      name: prefix + up(property),
      value: coercion(url[property])
    }))

  const secrets = SECRETS
    .map((property) => ({
      name: prefix + up(property),
      secret: {
        name: scope,
        key: property
      }
    }))


  variables.push(...secrets)

  return variables
}

const PROPERTIES = [['protocol', String], ['port', Number]]
const SECRETS = ['username', 'password']

exports.variables = variables
