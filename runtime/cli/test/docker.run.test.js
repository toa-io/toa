import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { EventEmitter } from 'node:events'

/** what was executed, in order */
let commands = []

/** how the container leaves: the arguments of `close`, or an error it fails to start with */
let exit

mock.module('node:child_process', {
  exports: {
    exec: (command, callback) => {
      commands.push(command)

      callback(null, { stdout: command.startsWith('docker images') ? IMAGES : '' })
    },
    spawn: (command, args) => {
      const child = new EventEmitter()

      commands.push([command, ...args].join(' '))

      // as a process leaves: `exit`, then `close` once its streams are
      setImmediate(() => {
        if (exit instanceof Error) child.emit('error', exit)
        else {
          child.emit('exit', ...exit)
          child.emit('close', ...exit)
        }
      })

      return child
    }
  }
})

const { run } = await import('../src/handlers/docker/run.js')

/** the bundle, and the dependencies it is laid over, newest first */
const IMAGES = 'bundle\ndeps\n'

beforeEach(() => {
  commands = []
})

describe('a container that exits', () => {
  it('should resolve where it exits with 0', async () => {
    exit = [0, null]

    await run('repository', 'toa compose *', '.env')

    assert.ok(commands.some((command) => command.startsWith('docker run')))
  })

  it('should reject with its code where it exits with another', async () => {
    exit = [3, null]

    await assert.rejects(run('repository', 'toa compose *', '.env'), (error) => {
      assert.equal(error.exitCode, 3)

      return true
    })
  })

  it('should reject where it is killed', async () => {
    exit = [null, 'SIGKILL']

    await assert.rejects(run('repository', 'toa compose *', '.env'), (error) => {
      assert.ok(error.exitCode > 0)
      assert.match(error.message, /SIGKILL/)

      return true
    })
  })

  it('should reject where it does not start', async () => {
    exit = new Error('spawn docker ENOENT')

    await assert.rejects(run('repository', 'toa compose *', '.env'), /ENOENT/)
  })
})

describe('the container', () => {
  it('should reach this machine as `host.docker.internal` wherever the daemon is', async () => {
    exit = [0, null]

    await run('repository', 'toa compose *', '.env')

    assert.ok(
      commands.some((command) =>
        /^docker run .*--add-host host\.docker\.internal:host-gateway /.test(command)
      )
    )
  })
})

describe('the images', () => {
  it('should run the newest', async () => {
    exit = [0, null]

    await run('repository', 'toa compose *', '.env')

    assert.ok(commands.some((command) => /^docker run .* bundle sh -c/.test(command)))
  })

  for (const [outcome, code] of [
    ['succeeds', [0, null]],
    ['fails', [1, null]],
    ['cannot start', new Error('spawn docker ENOENT')]
  ])
    it(`should be removed, all of them, where the run ${outcome}`, async () => {
      exit = code

      await run('repository', 'toa compose *', '.env').catch(() => undefined)

      assert.equal(commands.at(-1), 'docker rmi --force bundle deps')
    })
})
