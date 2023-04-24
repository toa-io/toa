'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { random } = require('@toa.io/generic')
const { Connector } = require('@toa.io/core')

/** @type {string[]} */
const protocols = require('../http/protocols')

const fixtures = require('./.test/aspect.fixtures')
const mock = fixtures.mock

jest.mock('node-fetch', () => mock.fetch)

const { create } = require('./aspect')

/** @type {toa.origins.http.Aspect} */ let aspect

beforeEach(() => {
  jest.clearAllMocks()

  aspect = create(fixtures.manifest)
})

it('should be instance of core.Connector', () => {
  expect(aspect).toBeInstanceOf(Connector)
})

it('should have name \'origins\'', () => {
  expect(aspect.name).toStrictEqual('http')
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
    mock.fetch.reset()
    mock.fetch.respond(200, response)

    result = await aspect.invoke(name, path, clone(request))
    call = mock.fetch.mock.calls[0]
    args = call?.[1]
  })

  it('should throw on unknown origin', async () => {
    await expect(() => aspect.invoke('bar', path, request)).rejects.toThrow(/is not defined/)
  })

  it('should resolve URL', async () => {
    jest.clearAllMocks()
    mock.fetch.respond(200, response)

    const path = 'ok'

    await aspect.invoke('deep', path, clone(request))

    expect(mock.fetch.mock.calls[0][0]).toStrictEqual(fixtures.manifest.deep + path)
  })

  it.each(protocols)('should throw on absolute URL (%s)',
    async (protocol) => {
      jest.clearAllMocks()
      mock.fetch.respond(200, response)

      await expect(aspect.invoke('deep', protocol + '//api.domain.com', clone(request)))
        .rejects.toThrow('Absolute URLs are forbidden')
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

    expect(url).toStrictEqual(fixtures.manifest.foo + '/' + path)
  })

  it('should not throw if path is not defined', async () => {
    jest.clearAllMocks()
    mock.fetch.respond(200, response)

    // noinspection JSCheckFunctionSignatures
    expect(() => aspect.invoke(name)).not.toThrow()
  })

  describe('fetch', () => {
    it('should fetch', async () => {
      expect(mock.fetch).toHaveBeenCalledTimes(1)
    })

    it('should pass url', () => {
      expect(call[0]).toStrictEqual(fixtures.manifest.foo + path)
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

      const attempts = random(5) + 2

      for (let i = 1; i < attempts; i++) mock.fetch.respond(500)

      mock.fetch.respond(200, response)

      /** @type {toa.origins.http.invocation.Options} */
      const options = {
        retry: { base: 0, retries: attempts }
      }

      await aspect.invoke(name, path, clone(request), options)

      expect(mock.fetch).toHaveBeenCalledTimes(attempts)
    })
  })
})

describe('absolute URL', () => {
  const response = { [generate()]: generate() }

  it.each(protocols)('should request absolute URL (%s)', async (protocol) => {
    mock.fetch.respond(200, response)

    const url = protocol + '//' + generate()
    const request = { method: 'POST' }

    await aspect.invoke(url, request)

    expect(mock.fetch).toHaveBeenCalledWith(url, request)
  })
})
