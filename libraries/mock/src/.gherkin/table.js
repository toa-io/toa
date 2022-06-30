'use strict'

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
    return this.#data
  }

  raw () {
    return this.#data
  }
}

/**
 * @type {toa.mock.gherkin.table.Constructor}
 */
const table = (data) => {
  return new Table(data)
}

exports.table = table
