import { spawn, exec } from 'node:child_process'
import { promisify } from 'node:util'

import { resolve } from 'node:path'

import { promex } from '@toa.io/generic'
import { findUp } from '@toa.io/generic'
import { MAP_LOCAL } from '@toa.io/definitions'

const execute = promisify(exec)

/**
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
    await execute(`docker images -q ${repository} | head -n 1`)

  const id = found.stdout.trim()
  const args = ['run', '--rm', ...envArgs, ...mapArgs, id, 'sh', '-c', command]
  const done = promex()

  const running = spawn('docker', args, { stdio: 'inherit' })

  running.on('exit', done.resolve)

  await done

  await execute(`docker rmi --force ${id}`)
}
