'use strict'

const path = require('path')
const execa = require('execa')

const { locate } = require('./dummies')

class CLI {
  silent = false

  #path

  constructor (dummy) {
    this.#path = locate(dummy)
  }

  async invoke (cmd, input = null, query = null) {
    const args = [JSON.stringify(input)]

    if (query) args.push(JSON.stringify(query))

    return this.exec('invoke', cmd, ...args)
  }

  async exec (...args) {
    args.push(`--path=${this.#path}`)
    args.push('--log=error')
    args.push('--ugly')
    args.push('--stacktrace')

    let output, error

    try {
      const result = await execa.node(BIN, args)

      if (result.stdout) { output = JSON.parse(result.stdout.split('\n').pop()) }
    } catch (e) {
      error = e

      if (this.silent) { this.silent = false } else { throw error }
    }

    return [output, error]
  }
}

const BIN = path.join(path.dirname(require.resolve('@kookaburra/cli')), './bin/kookaburra')

exports.CLI = CLI
