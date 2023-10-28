'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')

const { Runner } = require('../src/algorithms/runner')

it('should be', () => {
  expect(Runner).toBeDefined()
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
  expect(runner).toBeInstanceOf(Connector)
})

it('should return output', async () => {
  const values = [{ [generate()]: generate() }, generate()]

  for (const value of values) {
    const execute = () => value
    const algorithm = /** @type {toa.node.Algorithm} */ ({ execute })

    runner = new Runner(algorithm, context)

    await runner.connect()

    const reply = await runner.execute()

    expect(reply.output).toStrictEqual(value)
  }
})

it('should mount', async () => {
  const execute = () => undefined
  const mount = jest.fn(() => undefined)
  const algorithm = /** @type {toa.node.Algorithm} */ { execute, mount }
  const runner = new Runner(algorithm, context)

  await runner.connect()

  expect(mount).toHaveBeenCalledWith(context)
})
