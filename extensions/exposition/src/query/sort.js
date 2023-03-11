'use strict'

class Sort {
  #value

  constructor (value) {
    this.#value = value
  }

  /** @hot */
  parse (value, operation) {
    if (operation.query === false) return value

    if (value === undefined) return this.#value
    else return this.#value.concat(value)
  }
}

exports.Sort = Sort
