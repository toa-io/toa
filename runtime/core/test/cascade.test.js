'use strict'

jest.mock('../src/connector')

const clone = require('clone-deep')

const { Connector } = require('../src/connector')
const { Cascade } = require('../src/cascade')
const fixtures = require('./cascade.fixtures')

let cascade

beforeEach(() => {
  jest.clearAllMocks()

  cascade = new Cascade(clone(fixtures.bridges))
})

it('should depend on bridges', () => {
  expect(cascade).toBeInstanceOf(Connector)
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.bridges)
})

it('should call bridges.run', async () => {
  const args = [1, 2]
  await cascade.run(...args)

  for (const bridge of fixtures.bridges) expect(bridge.run).toHaveBeenCalledWith(...args)
})

it('should merge output', async () => {
  const reply = await cascade.run()

  expect(reply).toStrictEqual({ output: { a: true, b: true, c: true } })
})

it('should interrupt on error', async () => {
  const reply = await cascade.run({ error: 'b' })

  expect(reply).toStrictEqual({ error: 'b' })
  expect(fixtures.bridges[2].run).not.toHaveBeenCalled()
})
