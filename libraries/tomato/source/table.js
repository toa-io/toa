'use strict'

const { transpose } = require('@toa.io/generic')

/**
 * @implements {toa.tomato.Table}
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
    const [, ...rest] = this.#data

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
 * @type {toa.tomato.table.Constructor}
 */
const table = (data) => {
  return new Table(data)
}

exports.table = table
