'use strict'

const { spawn, exec } = require('node:child_process')
const { promisify } = require('node:util')

const { promex } = require('@toa.io/generic')

const execute = promisify(exec)

/**
 * @param {string} repository
 * @param {string} command
 * @param {string[]} runArguments
 * @return {Promise<void>}
 */
async function run (repository, command, runArguments) {
  const imagesResult =
    /** @type {{ stdout: string }} */
    await execute(`docker images -q ${repository} | head -n 1`)

  const id = imagesResult.stdout.trim()
  const args = ['run', '--rm', ...(runArguments ?? []), id, 'sh', '-c', command]
  const done = promex()

  console.log('toa> docker', args)

  const running = await spawn('docker', args, { stdio: 'inherit' })

  running.on('exit', done.resolve)

  await done

  await execute(`docker rmi ${id}`)
}

exports.run = run
