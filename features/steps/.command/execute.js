'use strict'

const { spawn } = require('node:child_process')
const { once } = require('node:events')

/**
 * @param {string} command
 * @param {import('child_process').SpawnOptions} [options]
 * @this {toa.features.Context}
 */
async function execute (command, options = {}) {
  options.cwd = this.cwd

  // the command leads its own process group, so aborting it takes the program along;
  // signalling the shell alone leaves what it started holding on to ports
  options.detached = true

  const child = spawn('/bin/sh', ['-c', command], options)

  let stdout = ''
  let stderr = ''

  child.stdout.on('data', (chunk) => (stdout += chunk))
  child.stderr.on('data', (chunk) => (stderr += chunk))

  this.aborted = false
  this.controller = { abort: () => abort.call(this, child) }

  const [code] = await once(child, 'close')

  this.exitCode = code

  if (code !== 0 && this.aborted !== true)
    console.error(`Command '${command}' exited with code ${code}\n${stderr}`)

  this.stdout = stdout.trim()
  this.stderr = stderr.trim()
  this.stdoutLines = lines(this.stdout)
  this.stderrLines = lines(this.stderr)
}

/**
 * @param {import('child_process').ChildProcess} child
 * @this {toa.features.Context}
 */
function abort (child) {
  this.aborted = true

  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    // the program is already gone
  }
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
