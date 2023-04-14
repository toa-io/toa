'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')

const { Runner } = require('../src/algorithms/runner')

it('should be', () => {
  expect(Runner).toBeDefined()
})

const context = /** @type {toa.node.Context} */ new Connector()

it('should return output', async () => {
  const values = [{ [generate()]: generate() }, generate()]

  for (const value of values) {
    const execute = () => value
    const ctor = () => /** @type {toa.core.bridges.Algorithm} */ ({ execute })
    const runner = new Runner(ctor, context)

    await runner.connect()

    const reply = await runner.run()

    expect(reply.output).toStrictEqual(value)
  }
})

it('should not return undefined output', async () => {
  const execute = () => undefined
  const ctor = () => ({ execute })
  const runner = new Runner(ctor, context)

  await runner.connect()

  const reply = await runner.run()

  expect(reply).toStrictEqual(undefined)
})
