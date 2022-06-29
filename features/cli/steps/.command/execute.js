'use strict'

const util = require('node:util')

/** @type {(command: string, options: import('child_process').SpawnOptions) => Promise<import('child_process').ChildProcess>} */
const exec = util.promisify(require('child_process').exec)

/**
 * @param {string} command
 * @param {import('child_process').ExecOptions} [options]
 */
async function execute (command, options = {}) {
  if (this.cwd !== undefined) options.cwd = this.cwd

  this.controller = new AbortController()

  options.signal = this.controller.signal

  /** @type {import('child_process').ChildProcess} */
  let result

  try {
    result = await exec(command, options)
  } catch (e) {
    result = e
    this.aborted = true
  }

  this.stdout = result.stdout
  this.stderr = result.stderr
  this.stdoutLines = lines(result.stdout)
  this.stderrLines = lines(result.stderr)
}

const lines = (string) => {
  const lines = string.split('\n')

  const last = lines[lines.length - 1]

  if (last === '') lines.pop()

  return lines
}

exports.execute = execute
