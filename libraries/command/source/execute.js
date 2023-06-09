'use strict'

const { exec } = require('node:child_process')
const { Readable } = require('node:stream')

/** @type {toa.command.Execute} */
const execute = (command, input = undefined) => {
  return new Promise((resolve) => {
    /** @type {toa.command.Result} */
    const process = exec(command, (_, stdout, stderr) => {
      process.output = stdout.trim()
      process.error = stderr.trim()

      resolve(process)
    })

    if (input !== undefined) pipe(input, process)
  })
}

/**
 * @param {string} input
 * @param {toa.command.Result} process
 */
function pipe (input, process) {
  const stream = new Readable()

  stream.push(input)
  stream.push(null)
  stream.pipe(process.stdin)
}

exports.execute = execute
