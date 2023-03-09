'use strict'

const { transpose } = require('@toa.io/generic')

/**
 * @implements {toa.mock.gherkin.Table}
 */
class Table {
  /** @type {any[][]} */
  #data

  /**
   * @param {any[][]} data
   */
  constructor (data) {
    this.#data = data
  }

  rows () {
    const [_, ...rest] = this.#data

    return rest
  }

  raw () {
    return this.#data
  }

  transpose () {
    this.#data = transpose(this.#data)

    return this
  }
}

/**
 * @type {toa.mock.gherkin.table.Constructor}
 */
const table = (data) => {
  return new Table(data)
}

exports.table = table
