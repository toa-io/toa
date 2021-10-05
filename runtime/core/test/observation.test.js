'use strict'

const fixtures = require('./operation.fixtures')
const mock = fixtures.mock

jest.mock('../src/operation', () => ({ Operation: mock }))

const { Observation } = require('../src/observation')

let observation

beforeEach(() => {
  jest.clearAllMocks()
  observation = new Observation(fixtures.cascade, fixtures.subject, fixtures.contract, fixtures.query)
})

it('should freeze state', async () => {
  const context = await observation.preprocess({})

  expect(Object.isFrozen(context.state)).toBe(true)
})
