'use strict'

const { spawn, exec } = require('node:child_process')
const { promisify } = require('node:util')

const { promex } = require('@toa.io/generic')
const { file: { dot } } = require('@toa.io/filesystem')

const execute = promisify(exec)

/**
 * @param {string} repository
 * @param {string} command
 * @return {Promise<void>}
 */
async function run (repository, command) {
  const found =
    /** @type {{ stdout: string }} */
    await execute(`docker images -q ${repository} | head -n 1`)

  const id = found.stdout.trim()
  const envFile = process.env.TOA_ENV_FILE ?? await dot('env')
  const args = ['run', '--rm', '--env-file', envFile, id, 'sh', '-c', command]
  const done = promex()

  const running = await spawn('docker', args, { stdio: 'inherit' })

  running.on('exit', done.resolve)

  await done

  await execute(`docker rmi ${id}`)
}

exports.run = run
