'use strict'

const freeze = require('deep-freeze')

class IO {
  input
  #output = {}
  #error = {}

  constructor (input) {
    this.input = { ...input }

    Object.freeze(this)
    Object.seal(this)
  }

  close () {
    freeze(this.input)
  }

  freeze () {
    freeze(this.#output)
    freeze(this.#error)
  }

  get output () {
    return IO.format(this.#output)
  }

  set output (_) {
    throw new Error('IO.output is a read only property')
  }

  get error () {
    return IO.format(this.#error)
  }

  set error (_) {
    throw new Error('IO.error is a read only property')
  }

  static format (value) {
    return Object.isFrozen(value) && Object.keys(value).length === 0 ? undefined : value
  }
}

exports.IO = IO
