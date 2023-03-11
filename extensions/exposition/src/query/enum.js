'use strict'

const { exceptions: { RequestConflictException } } = require('@toa.io/core')

class Enum {
  #value
  #keys

  constructor (value) {
    this.#value = value

    this.#keys = value.reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
  }

  /** @hot */
  parse (value, operation) {
    if (operation.type !== 'observation') return value

    if (value === undefined) return this.#value
    else if (value instanceof Array) {
      const key = value.find((key) => !(key in this.#keys))

      if (key !== undefined) {
        throw new RequestConflictException(`Query projection must not contain '${key}'`)
      }
    }

    return value
  }
}

exports.Enum = Enum
