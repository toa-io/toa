'use strict'

const freeze = require('deep-freeze')

module.exports = class IO {
  input = {}
  output = {}
  #error = undefined

  constructor () {
    Object.freeze(this)
    Object.seal(this)
  }

  set error (error) {
    if (!(error instanceof Error)) { throw new Error('Error value must be an instance of Error type') }

    if (this.#error) { throw new Error('Error value must be set only once') }

    this.#error = error
  }

  get error () {
    return this.#error
  }

  close () {
    freeze(this.input)
  }
}
