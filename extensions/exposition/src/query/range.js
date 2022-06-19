'use strict'

const { exceptions: { RequestConflictException } } = require('@toa.io/core')

class Range {
  #value
  #min
  #max

  constructor (constraint) {
    this.#value = constraint.value

    this.#min = constraint.range[0] === undefined ? this.#value : constraint.range[0]
    this.#max = constraint.range[1] === undefined ? this.#value : constraint.range[1]
  }

  /** @hot */
  parse (value, operation) {
    if (operation.type !== 'observation' || operation.subject !== 'set') return value
    if (value === undefined) return this.#value

    if (value > this.#max || value < this.#min) {
      throw new RequestConflictException(`Query omit/limit value is out of range [${this.#min}, ${this.#max}]`)
    }
  }
}

exports.Range = Range
