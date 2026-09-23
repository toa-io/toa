import { spawn, exec } from 'node:child_process'
import { promisify } from 'node:util'
import { constants } from 'node:os'

import { resolve } from 'node:path'

import { findUp } from '@toa.io/generic'
import { MAP_LOCAL } from '@toa.io/definitions'

const execute = promisify(exec)

/**
 * Runs the newest image of the repository, and removes every image of it once the container
 * has exited: the one it ran, and the dependencies that one is laid over.
 *
 * A container that exits with anything but 0 rejects with its code as `exitCode`, which the
 * program exits with, so a failed composition fails the command that ran it.
 *
 * @param {string} repository
 * @param {string} command
 * @param {string} [envFile]
 * @param {string} [mapFile] the component map, mounted where a deployed process reads one
 * @return {Promise<void>}
 */
// eslint-disable-next-line max-params
export async function run(repository, command, envFile, mapFile) {
  if (envFile === undefined) envFile = findUp('.env')

  const envArgs = envFile === undefined ? [] : ['--env-file', envFile]
  const mapArgs =
    mapFile === undefined ? [] : ['-v', `${resolve(mapFile)}:${MAP_LOCAL}:ro`]

  const found =
    /** @type {{ stdout: string }} */
    await execute(`docker images -q ${repository}`)

  // newest first, so the first is what was built last: the one laid over the others
  const ids = found.stdout.split('\n').filter((id) => id !== '')

  // what the environment names on this machine is `host.docker.internal` to the container,
  // which Docker Desktop resolves on its own and a Linux daemon only when told to
  const hostArgs = ['--add-host', 'host.docker.internal:host-gateway']
  const args = [
    'run',
    '--rm',
    ...hostArgs,
    ...envArgs,
    ...mapArgs,
    ids[0],
    'sh',
    '-c',
    command
  ]

  try {
    await container(args)
  } finally {
    await execute(`docker rmi --force ${ids.join(' ')}`)
  }
}

/**
 * @param {string[]} args
 * @return {Promise<void>}
 */
function container(args) {
  return new Promise((resolve, reject) => {
    const running = spawn('docker', args, { stdio: 'inherit' })

    running.once('error', reject)

    running.once('close', (code, signal) => {
      if (code === 0) return resolve()

      const reason = signal === null ? `code ${code}` : signal

      reject(
        new (class extends Error {
          // as a shell reports a process a signal ended
          exitCode = code ?? 128 + constants.signals[signal]
        })(`The composition exited with ${reason}`)
      )
    })
  })
}
