'use strict'

const { exec } = require('node:child_process')
const { Readable } = require('node:stream')

/** @type {toa.command.Execute} */
const execute = (command, input = undefined) => {
  return new Promise((resolve) => {
    /* eslint-disable node/handle-callback-err */
    /** @type {toa.command.Result} */
    const process = exec(command, (err, stdout, stderr) => {
      process.output = stdout.trim()
      process.error = stderr.trim()

      resolve(process)
    })

    if (input !== undefined) {
      const stream = new Readable()

      stream.push(input)
      stream.push(null)
      stream.pipe(process.stdin)
    }
  })
}

exports.execute = execute
