'use strict'

const { exceptions: { RequestConflictException } } = require('@toa.io/core')

class Criteria {
  #value
  #open
  #logic
  #right

  constructor (value) {
    if (value === null) return

    const last = value.substr(-1)

    if (last === ',' || last === ';') {
      this.#open = true
      this.#right = true
      this.#logic = last

      value = value.substr(0, value.length - 1)
    } else {
      const first = value.substr(0, 1)

      this.#open = first === ',' || first === ';'

      if (this.#open === true) {
        this.#right = false
        this.#logic = first

        value = value.substr(1)
      }
    }

    this.#value = value
  }

  /** @hot */
  parse (value, operation) {
    if (operation.query === false) return value

    if (value !== undefined) {
      if (this.#open === true) {
        if (this.#right) value = this.#value + this.#logic + value
        else value = value + this.#logic + this.#value
      } else {
        throw new RequestConflictException('Query criteria is defined as closed')
      }
    } else value = this.#value

    return value
  }
}

exports.Criteria = Criteria
