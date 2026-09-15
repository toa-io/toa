import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'
import { Connector } from '@toa.io/core'
import { Remotes } from './Remotes.ts'
import type { Host } from './Factory.ts'

const host = {
  remote: mock.fn(async () => ({
    connect: mock.fn(() => undefined),
    link: mock.fn(() => undefined)
  }))
} as unknown as Host

const namespace = generate()
const name = generate()

let remotes: Remotes

beforeEach(() => {
  remotes = new Remotes(host)
})

it('should create remote', async () => {
  const remote = await remotes.discover(namespace, name)

  assert.ok(
    host.remote.mock.calls.some(
      (call: any) =>
        isPartial(call.arguments[0], { namespace, name }) &&
        call.arguments[1] !== null &&
        call.arguments[1] !== undefined
    )
  )

  assert.deepStrictEqual(remote, await host.remote.mock.calls[0].result)
})

it('should be instance of Connector', async () => {
  assert.ok(remotes instanceof Connector)
})

it('should depend on created remotes', async () => {
  const remote = await remotes.discover(namespace, name)

  assert.ok(
    remote.link.mock.calls.some(
      (call: any) =>
        call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], remotes)
    )
  )
})

it('should attribute calls to the gateway', async () => {
  await remotes.discover(namespace, name)

  assert.ok(
    host.remote.mock.calls.some(
      (call: any) =>
        call.arguments[0] !== null &&
        call.arguments[0] !== undefined &&
        isDeepStrictEqual(call.arguments[1], { service: 'exposition' })
    )
  )
})

function isPartial(actual, expected) {
  try {
    assert.partialDeepStrictEqual(actual, expected)

    return true
  } catch {
    return false
  }
}

it('should build from the contract the branch carries', async () => {
  const contract = { version: generate() }

  await remotes.discover(namespace, name, contract)

  assert.ok(
    host.remote.mock.calls.some((call: any) => call.arguments[2] === contract),
    'the contract was not passed'
  )
})

it('should pass no contract where the branch carries none', async () => {
  await remotes.discover(namespace, name)

  assert.ok(
    host.remote.mock.calls.some((call: any) => call.arguments[2] === undefined),
    'a contract was passed where there is none'
  )
})

it('should hold one remote per version', async () => {
  const one = await remotes.discover(namespace, name, { version: 'a' })
  const other = await remotes.discover(namespace, name, { version: 'b' })

  assert.notDeepStrictEqual(one, other)
  assert.deepStrictEqual(one, await remotes.discover(namespace, name, { version: 'a' }))
})
