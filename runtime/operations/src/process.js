'use strict'

const execa = require('execa')

/**
 * @implements {toa.operations.Process}
 */
class Process {
  async execute (cmd, args) {
    const result = execa(cmd, args)

    result.stdout.pipe(process.stdout)

    return result
  }
}

exports.Process = Process
