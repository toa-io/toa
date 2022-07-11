'use strict'

const { exec } = require('node:child_process')

/** @type {toa.command.Execute} */
const execute = (command) => {
  return new Promise((resolve) => {
    /* eslint-disable node/handle-callback-err */
    /** @type {toa.command.Result} */
    const process = exec(command, (err, stdout, stderr) => {
      process.output = stdout.trim()
      process.error = stderr.trim()

      resolve(process)
    })
  })
}

exports.execute = execute
