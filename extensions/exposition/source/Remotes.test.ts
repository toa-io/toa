import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'
import { Connector } from '@toa.io/core'
import { Remotes } from './Remotes.js'
import type { Bootloader } from './Factory.js'
import type { Locator, Source } from '@toa.io/core'

mock.module('@toa.io/boot', { namedExports: ({
  remote: async (locator: Locator, source?: Source) => await boot.remote(locator, source)
}) })

const boot = {
  remote: mock.fn(async () => ({
    connect: mock.fn(() => undefined),
    link: mock.fn(() => undefined)
  }))
} as unknown as Bootloader

const namespace = generate()
const name = generate()

let remotes: Remotes

beforeEach(() => {
  remotes = new Remotes(boot)
})

it('should create remote', async () => {
  const remote = await remotes.discover(namespace, name)

  assert.ok(boot.remote.mock.calls.some((call: any) => call.arguments.length === 2 && isPartial(call.arguments[0], { namespace, name }) && call.arguments[1] !== null && call.arguments[1] !== undefined))

  assert.deepStrictEqual(remote, await boot.remote.mock.calls[0].result)
})

it('should be instance of Connector', async () => {
  assert.ok(remotes instanceof Connector)
})

it('should depend on created remotes', async () => {
  const remote = await remotes.discover(namespace, name)

  assert.ok(remote.link.mock.calls.some((call: any) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], remotes)))
})

it('should attribute calls to the gateway', async () => {
  await remotes.discover(namespace, name)

  assert.ok(boot.remote.mock.calls.some((call: any) => call.arguments.length === 2 && call.arguments[0] !== null && call.arguments[0] !== undefined && isDeepStrictEqual(call.arguments[1], { service: 'exposition' })))
})

function isPartial (actual, expected) {
  try {
    assert.partialDeepStrictEqual(actual, expected)

    return true
  } catch {
    return false
  }
}
