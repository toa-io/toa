'use strict'

const { cli } = require('./cli')

class Runtime {
  #path

  constructor (path) {
    this.#path = path
  }

  async invoke (cmd, input, query = null, silent = false) {
    const args = []

    args.push(JSON.stringify(input))

    if (query) args.push(JSON.stringify(query))

    args.push(`--path=${this.#path}`)

    cli.silent = silent

    return cli('invoke', cmd, ...args)
  }
}

exports.Runtime = Runtime
