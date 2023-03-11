'use strict'

const { generate } = require('randomstring')

const fixtures = require('./expand.fixtures')
const mock = fixtures.mock

jest.mock('@toa.io/concise', () => mock.concise)
jest.mock('../source/validator', () => mock.validator)

const { expand } = require('../')

it('should be', async () => {
  expect(expand).toBeDefined()
})

beforeEach(() => {
  jest.clearAllMocks()
})

it('should call cos/expand passing `valid` function', async () => {
  const value = generate()

  expand(value)

  expect(mock.concise.expand).toHaveBeenCalledWith(value, mock.validator.is)
})
