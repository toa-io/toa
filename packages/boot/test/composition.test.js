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

it('should create http', () => {
  expect(fixtures.mock.http.http).toHaveBeenCalledTimes(1)
})

it('should depend on http', () => {
  expect(instance.depends).toHaveBeenCalledWith(fixtures.mock.http.http.mock.results[0].value)
})

describe('http', () => {
  let http

  beforeEach(() => {
    http = fixtures.mock.http.http.mock.results[0].value
  })

  it('should pass options', () => {
    expect(fixtures.mock.http.http).toHaveBeenCalledWith(fixtures.options.http)
  })

  it('should depend on runtimes', () => {
    for (const { value: runtime } of fixtures.mock.runtime.runtime.mock.results) {
      expect(http.depends).toHaveBeenCalledWith(runtime)
    }
  })

  it('should bind runtimes', () => {
    expect.assertions(2)

    for (const { value: runtime } of fixtures.mock.runtime.runtime.mock.results) {
      expect(http.bind).toHaveBeenCalledWith(runtime, [])
    }
  })
})
