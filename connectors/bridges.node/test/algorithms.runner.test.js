'use strict'

const { it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')

const { Runner } = require('../src/algorithms/runner')

it('should be', () => {
  assert.notStrictEqual(Runner, undefined)
})

const context = /** @type {toa.node.Context} */ new Connector()

/** @type {Runner} */
let runner

beforeEach(() => {
  const execute = () => undefined
  const algorithm = /** @type {toa.node.Algorithm} */ ({ execute })

  runner = new Runner(algorithm, context)
})

it('should be instance of Connector', async () => {
  assert.ok(runner instanceof Connector)
})

it('should return output', async () => {
  const values = [{ [generate()]: generate() }, generate()]

  for (const value of values) {
    const execute = () => value
    const algorithm = /** @type {toa.node.Algorithm} */ ({ execute })

    runner = new Runner(algorithm, context)

    await runner.connect()

    const reply = await runner.execute()

    assert.deepStrictEqual(reply.output, value)
  }
})

it('should mount', async () => {
  const execute = () => undefined
  const mount = mock.fn(() => undefined)
  const algorithm = /** @type {toa.node.Algorithm} */ { execute, mount }
  const runner = new Runner(algorithm, context)

  await runner.connect()

  assert.ok(mount.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], context)))
})
