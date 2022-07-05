'use strict'

const util = require('node:util')

/** @type {(command: string, options: import('child_process').SpawnOptions) => Promise<import('child_process').ChildProcess>} */
const exec = util.promisify(require('child_process').exec)

/**
 * @param {string} command
 * @param {import('child_process').ExecOptions} [options]
 * @this {toa.features.Context}
 */
async function execute (command, options = {}) {
  options.cwd = this.cwd

  this.controller = new AbortController()

  options.signal = this.controller.signal

  /** @type {any} */
  let result

  try {
    result = await exec(command, options)
  } catch (e) {
    result = e
    this.aborted = e.code === 'ABORT_ERR'
  }

  this.stdout = result.stdout.trim()
  this.stderr = result.stderr.trim()
  this.stdoutLines = lines(this.stdout)
  this.stderrLines = lines(this.stderr)
}

/**
 * @param {string} string
 * @return {string[]}
 */
const lines = (string) => {
  const lines = string.split('\n')

  const last = lines[lines.length - 1]

  if (last === '') lines.pop()

  return lines
}

exports.execute = execute
