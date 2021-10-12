'use strict'

const { Connector } = require('@kookaburra/core')

const { Operation } = require('../src/operation')
const fixtures = require('./operation.fixtures')

let operation

beforeEach(() => {
  operation = new Operation(fixtures.operation, fixtures.context)
})

it('should extend Connector', () => {
  expect(Operation.prototype).toBeInstanceOf(Connector)
})

it('should run algorithm', async () => {
  await operation.run({ input: 1 })

  expect(fixtures.operation.observation).toHaveBeenCalled()
})

it('should pass input, state, context', async () => {
  const input = { a: 1 }
  const state = { b: 2 }

  await operation.run(input, state)

  expect(fixtures.operation.observation).toHaveBeenCalledWith(input, state, fixtures.context)
})

it('should return output', async () => {
  const reply = await operation.run()
  const result = await fixtures.operation.observation.mock.results[0].value

  expect(reply).toBeDefined()
  expect(reply).toStrictEqual(result)
})
