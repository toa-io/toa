'use strict'

const { PRIMITIVES } = require('./constants')

/**
 * @param {any[]} array
 * @returns {toa.schema.JSON}
 */
const array = (array) => {
  if (array.length === 0) throw new Error('Array property declaration must be non-empty')

  const type = /** @type {toa.schema.Type} */ typeof array[0]

  // array of a given type
  if (array.length === 1 && PRIMITIVES.includes(array[0])) {
    const type = /** @type {toa.schema.Type} */ array[0]

    return {
      type: 'array', items: { type }
    }
  }

  // one of given constants
  const oneOf = []

  for (const value of array) {
    if (typeof value !== type) { // eslint-disable-line
      throw new Error('Array property items must be of the same type')
    }

    const option = { const: value }

    oneOf.push(option)
  }

  return { type, oneOf }
}

exports.array = array
