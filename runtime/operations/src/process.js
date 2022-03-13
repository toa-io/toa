'use strict'

const execa = require('execa')

class Process {
  #log

  constructor (log) {
    this.#log = log
  }

  async execute (cmd, args) {
    const result = execa(cmd, args)

    if (this.#log === true) result.stdout.pipe(process.stdout)

    return result
  }
}

exports.Process = Process
