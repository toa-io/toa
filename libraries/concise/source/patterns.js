'use strict'

const { EXPRESSION } = require('./expressions/constants')

/**
 * @param {Object} properties
 * @returns {Object}
 */
const patterns = (properties) => {
  const patterns = {}

  for (const [property, schema] of Object.entries(properties)) {
    for (const test of tests) {
      const result = test(property, schema)

      if (result === null) continue

      const [key, value] = result

      patterns[key] = value

      delete properties[property]
    }
  }

  return patterns
}

const expression = (key, value) => {
  const match = key.match(EXPRESSION)

  if (match === null) return null
  else return [match.groups.expression, value]
}

const wildcard = (key, value) => {
  if (key !== 'null') return null
  else return ['^.*$', value]
}

const tests = [expression, wildcard]

exports.patterns = patterns
