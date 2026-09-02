import { spawn, exec } from 'node:child_process'
import { promisify } from 'node:util'

import { promex } from '@toa.io/generic'
import { findUp } from 'find-up'

const execute = promisify(exec)

/**
 * @param {string} repository
 * @param {string} command
 * @param {string} [envFile]
 * @return {Promise<void>}
 */
async function run (repository, command, envFile) {
  if (envFile === undefined) envFile = await findUp('.env')

  const envArgs = envFile === undefined ? [] : ['--env-file', envFile]

  const found =
    /** @type {{ stdout: string }} */
    await execute(`docker images -q ${repository} | head -n 1`)

  const id = found.stdout.trim()
  const args = ['run', '--rm', ...envArgs, id, 'sh', '-c', command]
  const done = promex()

  const running = spawn('docker', args, { stdio: 'inherit' })

  running.on('exit', done.resolve)

  const code = await done

  await execute(`docker rmi --force ${id}`)
}

export { run }
