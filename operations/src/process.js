import { spawn } from 'node:child_process'

/**
 * @implements {toa.operations.Process}
 */
export class Process {
  async execute(cmd, args, options = {}) {
    console.log('toa>', cmd, args.join(' '))

    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    const stdout = []
    const stderr = []

    child.stdout.on('data', (chunk) => stdout.push(chunk))
    child.stderr.on('data', (chunk) => stderr.push(chunk))

    if (options.silently !== true) {
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
    }

    await exit(child, cmd, args, () => Buffer.concat(stderr).toString())

    return Buffer.concat(stdout).toString().replace(/\n$/, '')
  }
}

/**
 * Runs a command on this process's own streams, and answers once it has exited.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @returns {Promise<void>}
 */
export async function run(cmd, args) {
  console.log('toa>', cmd, args.join(' '))

  await exit(spawn(cmd, args, { stdio: 'inherit' }), cmd, args)
}

/**
 * @param {import('node:child_process').ChildProcess} child
 * @param {string} cmd
 * @param {string[]} args
 * @param {() => string} stderr
 * @returns {Promise<void>}
 */
const exit = (child, cmd, args, stderr = () => '') =>
  new Promise((resolve, reject) => {
    child.once('error', reject)

    child.once('close', (code, signal) => {
      if (code === 0) return resolve()

      const output = stderr()
      const reason = signal === null ? `exit code ${code}` : signal

      reject(
        new Error(
          `Command failed with ${reason}: ${cmd} ${args.join(' ')}` +
            (output === '' ? '' : '\n' + output.trimEnd())
        )
      )
    })
  })
