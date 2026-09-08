import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { Readable } from 'node:stream'
import { setTimeout } from 'node:timers/promises'
import { Execution, type Context } from './Execution.js'
import type { Remotes } from '../../../Remotes.js'

describe('Execution', () => {
  it('should report every step', async () => {
    const { remotes } = stub({ first: () => ({ a: 1 }), second: () => null })
    const execution = new Execution(context(), [{ first: 'tester.first' }, { second: 'tester.second' }], remotes)

    const reports = await execution.toArray()

    assert.deepStrictEqual(reports, [
      { step: 'first', status: 'completed', output: { a: 1 } },
      { step: 'second', status: 'completed', output: null }
    ])
  })

  it('should start no further unit once destroyed', async () => {
    const { remotes, calls } = stub({ first: async () => await setTimeout(20), second: () => null })
    const execution = new Execution(context(), [{ first: 'tester.first' }, { second: 'tester.second' }], remotes)

    execution.resume()
    await setTimeout(5)
    execution.destroy()
    await setTimeout(50)

    assert.deepStrictEqual(calls, ['first'])
  })

  it('should destroy a step stream it is reading', async () => {
    const stream = new Readable({ objectMode: true, read: () => {} })
    const { remotes } = stub({ first: () => stream })
    const execution = new Execution(context(), [{ first: 'tester.first' }], remotes)
    const closed = once(stream, 'close')

    execution.resume()
    await setTimeout(5)
    execution.destroy()

    await Promise.race([closed, setTimeout(100).then(() => assert.fail('stream not destroyed'))])
  })
})

function stub(operations: Record<string, () => unknown>): { remotes: Remotes; calls: string[] } {
  const calls: string[] = []

  const component = {
    invoke: async (operation: string) => {
      calls.push(operation)

      return await operations[operation]()
    }
  }

  const remotes = { discover: async () => component } as unknown as Remotes

  return { remotes, calls }
}

function context(): Context {
  return {
    authority: 'nex.toa.io',
    storage: 'octets',
    path: '/',
    entry: { id: '1' } as Context['entry'],
    parameters: {},
    steps: {}
  }
}
