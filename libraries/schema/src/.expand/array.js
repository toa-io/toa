'use strict'

const { PRIMITIVES } = require('./constants')

/**
 * @param {any[]} array
 * @param {Function} expand
 * @returns {toa.schema.JSON}
 */
const array = (array, expand) => {
  if (array.length === 0) throw new Error('Array property declaration must be non-empty')

  const type = /** @type {toa.schema.Type} */ typeof array[0]

  // array of a given type
  if (array.length === 1) {
    const sample = array[0]

    let items

    if (PRIMITIVES.includes(sample)) items = { type: sample }
    else items = expand(array[0])

    return {
      type: 'array',
      items
    }
  }

  // enum of given values
  const enumeration = []

  for (const value of array) {
    if (typeof value !== type) { // eslint-disable-line
      throw new Error('Array property items must be of the same type')
    }

    enumeration.push(value)
  }

  return { type, enum: enumeration }
}

exports.array = array
