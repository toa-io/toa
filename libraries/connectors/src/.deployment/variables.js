'use strict'

const { letters: { up } } = require('@toa.io/libraries/generic')

/**
 * @param {toa.norm.context.dependencies.Instance} instance
 * @param {URL} url
 * @param {string} suffix
 */
const variables = (instance, url, suffix) => {
  const prefix = `TOA_${up(suffix)}_${instance.locator.uppercase}_`

  return PROPERTIES
    .filter(([property]) => {
      return url[property] !== ''
    }).map(([property, coercion]) => ({
      name: prefix + up(property),
      value: coercion(url[property])
    }))
}

const PROPERTIES = [['port', Number], ['protocol', String]]

exports.variables = variables
