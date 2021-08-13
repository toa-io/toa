'use strict'

const { cli } = require('./cli')

class Runtime {
  #path

  constructor (path) {
    this.#path = path
  }

  invoke (cmd, input) {
    const args = this.#input(input)

    return cli('invoke', this.#path, cmd, ...args)
  }

  #input (input) {
    return Object.entries(input).map(([key, value]) => `--input.${key}=${Runtime.#value(value)}`)
  }

  static #value (value) {
    value = value.toString()

    return value.indexOf(' ') > -1 ? `'${value}'` : value
  }
}

exports.Runtime = Runtime
