'use strict'

const freeze = require('deep-freeze')

class IO {
  input
  output = {}
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
    freeze(this.output)
    freeze(this.#error)
  }

  get error () {
    return Object.isFrozen(this.#error) && Object.keys(this.#error).length === 0 ? undefined : this.#error
  }

  set error (_) {
    throw new Error('IO.error is a read only property')
  }
}

exports.IO = IO
