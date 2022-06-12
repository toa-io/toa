'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const { Connector } = require('@toa.io/core')

const fixtures = require('./context.fixtures')
const mock = fixtures.mock

jest.mock('node-fetch', () => mock.fetch)

const { Context } = require('../src/context')

let context

beforeEach(() => {
  jest.clearAllMocks()

  context = new Context(fixtures.declaration)
})

it('should be instance of core.Connector', () => {
  expect(context).toBeInstanceOf(Connector)
})

it('should have name \'origins\'', () => {
  expect(context.name).toStrictEqual('origins')
})

describe('invoke', () => {
  const path = '/' + generate()
  const headers = { [generate().toLowerCase()]: generate() }
  const body = generate()

  /** @type {toa.extensions.origins.Request} */
  const request = { method: 'PATCH', headers, body }
  const name = 'foo'

  let response
  let call
  let args

  beforeEach(async () => {
    jest.clearAllMocks()

    response = await context.invoke(name, path, clone(request))
    call = mock.fetch.mock.calls[0]
    args = call?.[1]
  })

  it('should throw on unknown origin', async () => {
    expect(() => context.invoke('bar', path, request)).toThrow(/is not defined/)
  })

  it('should not resolve absolute urls', async () => {
    jest.clearAllMocks()

    const path = 'https://toa.io'

    await context.invoke(name, path, clone(request))

    expect(mock.fetch.mock.calls[0][0]).toStrictEqual(fixtures.declaration.origins.foo + '/' + path)
  })

  it('should substitute wildcards', async () => {
    jest.clearAllMocks()

    const substitutions = ['foo', 'bar', 443]

    await context.invoke('amazon', path, clone(request), substitutions)

    const url = mock.fetch.mock.calls[0][0]

    expect(url).toStrictEqual('https://foo.bar.amazon.com' + path)
  })

  it('should keep not lose query string', async () => {
    jest.clearAllMocks()

    const path = generate() + '?foo=' + generate()

    await context.invoke(name, path)

    const url = mock.fetch.mock.calls[0][0]

    expect(url).toStrictEqual(fixtures.declaration.origins.foo + '/' + path)
  })

  it('should throw if path is not defined', async () => {
    jest.clearAllMocks()

    expect(() => context.invoke(name)).toThrow(/path must be defined/)
  })

  describe('fetch', () => {
    it('should fetch', async () => {
      expect(mock.fetch).toHaveBeenCalledTimes(1)
    })

    it('should pass url', () => {
      expect(call[0]).toStrictEqual(fixtures.declaration.origins.foo + path)
    })

    it('should pass request', () => {
      expect(args).toStrictEqual(request)
    })

    it('should return response', async () => {
      const expected = await mock.fetch.mock.results[0].value

      expect(response).toStrictEqual(expected)
    })
  })
})
