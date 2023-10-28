'use strict'

const { PRIMITIVES } = require('./expressions/constants')

/**
 * @param {any[]} array
 * @param {toa.cos.validate} validate
 * @returns {Object}
 */
const array = (array, validate) => {
  const { expand } = require('./expand') // avoid circular dependency

  if (array.length === 0) throw new Error('Array property declaration must be non-empty')

  const type = typeof array[0]
  const sample = array[0]

  // array of a given type
  if (array.length === 1) {
    let items

    if (PRIMITIVES.includes(sample)) items = { type: sample }
    else items = expand(array[0], validate)

    return {
      type: 'array',
      items
    }
  }

  if (typeof sample !== 'object') { // enum of given values
    const enumeration = []

    for (const value of array) {
      if (typeof value !== type) { // eslint-disable-line
        throw new Error('Array property items must be of the same type')
      }

      enumeration.push(value)
    }

    return { type, enum: enumeration }
  } else { // one of the schemas
    const oneOf = array.map((item) => expand(item, validate))

    return {
      oneOf
    }
  }
}

exports.array = array
