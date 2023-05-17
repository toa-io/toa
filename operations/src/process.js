'use strict'

const execa = require('execa')

/**
 * @implements {toa.operations.Process}
 */
class Process {
  async execute (cmd, args, options = {}) {
    console.log('toa> ', cmd, args.join(' '))

    /** @type {execa.ExecaReturnValue<import('stream').Stream>} */
    const command = execa(cmd, args)

    if (options.silently !== true) {
      command.stdout.pipe(process.stdout)
      command.stderr.pipe(process.stderr)
    }

    /** @type {execa.ExecaReturnValue<string>} */
    const result = await command

    return result.stdout
  }
}

exports.Process = Process
