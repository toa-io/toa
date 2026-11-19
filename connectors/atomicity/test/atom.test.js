import { describe, it } from 'node:test'
import assert from 'node:assert'
import { ExecutionError } from '@sesamecare-oss/redlock'
import { Connector } from '@toa.io/core'
import { Atom } from '../src/atom.js'

/**
 * A connection whose lock is refused until `refusals` attempts have been made, as when another
 * replica holds it; `Infinity`, it is never acquired.
 */
function connected(refusals) {
  const connection = new Connector()
  const attempts = []

  connection.redlock = {
    using: async (resources, duration, settings, routine) => {
      attempts.push({ resources, settings })

      if (attempts.length <= refusals)
        throw new ExecutionError(
          'The operation was unable to achieve a quorum during its retry window.',
          []
        )

      return await routine(new AbortController().signal)
    }
  }

  return { connection, attempts }
}

describe('lock', () => {
  it('runs the routine once the lock is acquired', async () => {
    const { connection, attempts } = connected(2)
    const atom = new Atom(connection, 'group')

    const result = await atom.lock('key', async () => 'done')

    assert.equal(result, 'done')
    assert.equal(attempts.length, 3)
  })

  it('does not try again after the routine fails', async () => {
    const { connection, attempts } = connected(0)
    const atom = new Atom(connection, 'group')

    await assert.rejects(
      atom.lock('key', async () => {
        throw new Error('failed')
      }),
      { message: 'failed' }
    )

    assert.equal(attempts.length, 1)
  })

  it('gives up a lock it waits for once it is closed', async () => {
    const { connection, attempts } = connected(Infinity)
    const atom = new Atom(connection, 'group')

    const waiting = atom.lock('key', async () => 'done')

    await new Promise((resolve) => setTimeout(resolve, 500))
    await atom.close()

    await assert.rejects(waiting, { code: 405 })

    const made = attempts.length

    await new Promise((resolve) => setTimeout(resolve, 500))

    assert.equal(attempts.length, made, 'tried again after it was closed')
  })

  it('gives up once the connection is closed', async () => {
    const { connection } = connected(Infinity)
    const atom = new Atom(connection, 'group')

    const waiting = atom.lock('key', async () => 'done')

    await new Promise((resolve) => setTimeout(resolve, 500))

    connection.redlock = undefined

    await assert.rejects(waiting, { code: 405 })
  })
})
