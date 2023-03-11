'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { random } = require('@toa.io/generic')

const { Connector } = require('@toa.io/core')

const fixtures = require('./aspect.fixtures')
const mock = fixtures.mock

jest.mock('node-fetch', () => mock.fetch)

const { Aspect } = require('../src/aspect')

/** @type {toa.extensions.origins.Aspect} */ let aspect

beforeEach(() => {
  jest.clearAllMocks()

  aspect = new Aspect(fixtures.declaration)
})

it('should be instance of core.Connector', () => {
  expect(aspect).toBeInstanceOf(Connector)
})

it('should have name \'origins\'', () => {
  expect(aspect.name).toStrictEqual('origins')
})

describe('invoke', () => {
  const path = '/' + generate()
  const headers = { [generate().toLowerCase()]: generate() }
  const body = generate()

  /** @type {import('node-fetch').RequestInit} */
  const request = { method: 'PATCH', headers, body }
  const name = 'foo'
  const response = { [generate()]: generate() }

  let call
  let args
  let result

  beforeEach(async () => {
    jest.clearAllMocks()

    mock.fetch.respond(200, response)

    result = await aspect.invoke(name, path, clone(request))
    call = mock.fetch.mock.calls[0]
    args = call?.[1]
  })

  it('should throw on unknown origin', async () => {
    await expect(() => aspect.invoke('bar', path, request)).rejects.toThrow(/is not defined/)
  })

  it('should not resolve absolute urls', async () => {
    jest.clearAllMocks()
    mock.fetch.respond(200, response)

    const path = 'https://toa.io'

    await aspect.invoke(name, path, clone(request))

    expect(mock.fetch.mock.calls[0][0]).toStrictEqual(fixtures.declaration.origins.foo + '/' + path)
  })

  it('should substitute wildcards', async () => {
    jest.clearAllMocks()
    mock.fetch.respond(200, response)

    const substitutions = ['foo', 'bar', 443]

    await aspect.invoke('amazon', path, clone(request), { substitutions })

    const url = mock.fetch.mock.calls[0][0]

    expect(url).toStrictEqual('https://foo.bar.amazon.com' + path)
  })

  it('should not lose query string', async () => {
    jest.clearAllMocks()
    mock.fetch.respond(200, response)

    const path = generate() + '?foo=' + generate()

    await aspect.invoke(name, path)

    const url = mock.fetch.mock.calls[0][0]

    expect(url).toStrictEqual(fixtures.declaration.origins.foo + '/' + path)
  })

  it('should not throw if path is not defined', async () => {
    jest.clearAllMocks()
    mock.fetch.respond(200, response)

    expect(() => aspect.invoke(name)).not.toThrow()
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
      const body = await result.json()

      expect(body).toStrictEqual(response)
    })
  })

  describe('retry', () => {
    it('should retry', async () => {
      jest.clearAllMocks()

      const attempts = random(5) + 1

      for (let i = 1; i < attempts; i++) mock.fetch.respond(500)

      mock.fetch.respond(200, response)

      /** @type {toa.extensions.origins.invocation.Options} */
      const options = {
        retry: { base: 0, retries: attempts }
      }

      await aspect.invoke(name, path, clone(request), options)

      expect(mock.fetch).toHaveBeenCalledTimes(attempts)
    })
  })
})
