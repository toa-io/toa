import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Readable } from 'node:stream'
import { setTimeout } from 'node:timers/promises'
import { Delete } from './Delete.js'
import type { Input } from './types.js'
import type { Remotes } from '../../Remotes.js'
import type { Component } from '@toa.io/core'

describe('octets:delete with a workflow', () => {
  it('should delete once the workflow has completed', async () => {
    const { storage, deleted } = createStorage()
    const remotes = createRemotes({ step: () => ({ done: true }) })
    const output = await apply(storage, remotes)
    const reports = await (output.body as Readable).toArray()

    assert.deepStrictEqual(reports, [{ step: 'step', status: 'completed', output: { done: true } }])
    assert.deepStrictEqual(deleted, ['/file'])
  })

  it('should not delete after a step exception', async () => {
    const { storage, deleted } = createStorage()

    const remotes = createRemotes({
      step: () => {
        throw new Error('boom')
      }
    })

    const output = await apply(storage, remotes)
    const reports = await (output.body as Readable).toArray()

    assert.deepStrictEqual(reports, [{ step: 'step', status: 'exception' }])
    assert.deepStrictEqual(deleted, [])
  })

  it('should not delete once the reply is destroyed', async () => {
    const { storage, deleted } = createStorage()
    const remotes = createRemotes({ step: async () => await setTimeout(20) })
    const output = await apply(storage, remotes)
    const body = output.body as Readable

    body.resume()
    await setTimeout(5)
    body.destroy()
    await setTimeout(50)

    assert.deepStrictEqual(deleted, [])
  })
})

async function apply(storage: Component, remotes: Remotes): Promise<{ body?: unknown }> {
  const directive = new Delete({ workflow: { step: 'tester.step' } }, Promise.resolve(storage), remotes)

  const input = {
    authority: 'nex.toa.io',
    request: { url: '/file', headers: {} }
  } as unknown as Input

  const output = await directive.apply('octets', input, [])

  assert.ok(output !== null)

  return output
}

function createStorage(): { storage: Component; deleted: string[] } {
  const deleted: string[] = []

  const storage = {
    invoke: async (operation: string, request: { input: { path: string } }) => {
      if (operation === 'head') return { id: '1' }

      if (operation === 'delete') deleted.push(request.input.path)

      return null
    }
  } as unknown as Component

  return { storage, deleted }
}

function createRemotes(operations: Record<string, () => unknown>): Remotes {
  const component = { invoke: async (operation: string) => await operations[operation]() }

  return { discover: async () => component } as unknown as Remotes
}
