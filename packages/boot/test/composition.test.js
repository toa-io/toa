'use strict'

const fixtures = require('./composition.fixtures')
const mock = fixtures.mock

jest.mock('@kookaburra/runtime', () => mock['@kookaburra/runtime'])
jest.mock('@kookaburra/package', () => mock['@kookaburra/package'])
jest.mock('../src/runtime', () => mock.runtime)
jest.mock('../src/http', () => mock.http)

const { composition } = require('../src/composition')

let instance

beforeEach(async () => {
  jest.clearAllMocks()

  instance = await composition(fixtures.dirs, fixtures.options)
})

it('should create Connector', () => {
  expect(instance).toStrictEqual(fixtures.mock['@kookaburra/runtime'].Connector.mock.results[0].value)
})
