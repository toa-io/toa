'use strict'

const fetch = require('node-fetch')
const { timeout, newid, random, repeat } = require('@toa.io/gears')
const { exceptions: { codes } } = require('@toa.io/core')
const extension = require('../extensions/resources')

const framework = require('./framework')

let resources, composition, a

const locator = (path) => 'http://localhost:8000' + path

beforeAll(async () => {
  composition = await framework.compose(['messages', 'stats', 'credits'])
  resources = await (new extension.Factory()).process()

  await resources.connect()
  await timeout(200) // resources discovery
})

afterAll(async () => {
  if (resources) await resources.disconnect()
  if (composition) await composition.disconnect()
  if (a) await a.disconnect()
})

describe('routing', () => {
  it('should expose routes', async () => {
    const id = newid()
    const url = locator('/credits/balance/' + id + '/')
    const response = await fetch(url)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toStrictEqual({ output: { id, balance: 10 } })
  })

  it('should expose routes dynamically', async () => {
    const url = locator('/dummies/a/')
    const request = {
      method: 'POST',
      body: JSON.stringify({ title: 'foo', length: 1 }),
      headers: { 'content-type': 'application/json' }
    }

    const before = await fetch(url, request)

    expect(before.status).toBe(404)

    a = await framework.compose(['a'])

    await a.connect()
    await timeout(50) // expose resources

    const after = await fetch(url, request)

    expect(after.status).toBe(201)
  })

  it('should return 404 on route mismatch', async () => {
    const url = locator('/no/route/matches')
    const response = await fetch(url)

    expect(response.status).toBe(404)
  })

  it('should return 404 on node mismatch', async () => {
    const url = locator('/credits/balance/no/node/matches')
    const response = await fetch(url)

    expect(response.status).toBe(404)
  })
})

describe('request', () => {
  it('should return 400 on invalid query', async () => {
    const url = locator('/credits/balance/' + newid() + '/?foo=bar')
    const response = await fetch(url)
    const reply = await response.json()

    expect(response.status).toBe(400)

    expect(reply).toStrictEqual({
      code: codes.RequestContract,
      keyword: 'additionalProperties',
      property: 'foo',
      path: '/query',
      schema: '#/properties/query/additionalProperties',
      message: expect.any(String)
    })
  })

  it('should return 400 on invalid body', async () => {
    const id = newid()
    const url = locator('/stats/' + id + '/')

    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify({ foo: 'bar' }),
      headers: { 'content-type': 'application/json' }
    })

    const reply = await response.json()

    expect(response.status).toBe(400)

    expect(reply).toStrictEqual({
      code: codes.RequestContract,
      keyword: 'additionalProperties',
      property: 'foo',
      path: '/input',
      schema: '#/properties/input/additionalProperties',
      message: expect.any(String)
    })
  })

  it('should return 405 if no method matched', async () => {
    const id = newid()
    const url = locator('/stats/' + id + '/')

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ foo: 'bar' }),
      headers: { 'content-type': 'application/json' }
    })

    expect(response.status).toBe(405)
  })

  it('should return 501 on unsupported method', async () => {
    const response = await fetch(locator('/'), { method: 'PROPPATCH' })
    expect(response.status).toBe(501)
  })

  describe('if-match', () => {
    const sender = newid()
    const urls = { messages: locator('/messages/' + sender + '/') }

    beforeAll(async () => {
      const created = await fetch(urls.messages, {
        method: 'POST',
        body: JSON.stringify({ text: 'foo' }),
        headers: { 'content-type': 'application/json' }
      })

      expect(created.status).toBe(201)

      const { output } = await created.json()

      urls.message = locator('/messages/' + sender + '/' + output.id + '/')
    })

    it('should return 400 if if-match is invalid', async () => {
      const response = await fetch(urls.message, {
        method: 'PUT',
        body: JSON.stringify({ text: 'bar' }),
        headers: {
          'content-type': 'application/json',
          'if-match': 'foo'
        }
      })

      const body = await response.json()

      expect(response.status).toBe(400)

      expect(body).toStrictEqual({
        code: codes.RequestFormat,
        message: 'ETag value must match /^"([^"]+)"$/'
      })
    })

    it('should return 400 if if-match is not a number', async () => {
      const response = await fetch(urls.message, {
        method: 'PUT',
        body: JSON.stringify({ sender, text: 'bar' }),
        headers: {
          'content-type': 'application/json',
          'if-match': '"foo"'
        }
      })

      const body = await response.json()

      expect(response.status).toBe(400)

      expect(body).toStrictEqual({
        code: codes.RequestContract,
        keyword: 'type',
        property: 'query/version',
        path: '/query/version',
        schema: '#/properties/query/properties/version/type',
        message: expect.any(String)
      })
    })

    it('should allow wildcard', async () => {
      const wildcard = await fetch(urls.message, {
        method: 'PUT',
        body: JSON.stringify({ sender, text: 'baz' }),
        headers: {
          'content-type': 'application/json',
          'if-match': '*'
        }
      })

      expect(wildcard.status).toBe(200)
    })
  })

  describe('if-none-match', () => {
    it('should return 304 with no body', async () => {
      const id = newid()
      const url = locator('/credits/balance/' + id + '/')
      const response = await fetch(url)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(response.headers.get('etag')).toBe('"0"')
      expect(body).toStrictEqual({ output: { id, balance: 10 } })

      const conditional = await fetch(url, {
        headers: { 'if-none-match': '"0"' }
      })

      const text = await conditional.text()

      expect(conditional.status).toBe(304)
      expect(text).toBe('')
    })
  })

  describe('path params', () => {
    const times = 5 + random(5)
    const sender = newid()
    const url = locator('/messages/' + sender + '/')

    it('should use path params as query criteria for safe methods', async () => {
      const send = async () => {
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({ text: 'foo' }),
          headers: { 'content-type': 'application/json' }
        })

        expect(response.status).toBe(201)
      }

      await repeat(send, times)

      const response = await fetch(url)
      const { output } = await response.json()

      expect(response.status).toBe(200)
      expect(output.length).toBe(times)

      for (const message of output) {
        expect(message.sender).toBe(sender)
      }
    })

    it('should return 403 on input conflict', async () => {
      const fake = newid()

      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ sender: fake, text: 'foo' }),
        headers: { 'content-type': 'application/json' }
      })

      const output = await response.json()

      expect(response.status).toBe(403)

      expect(output).toStrictEqual({
        code: codes.RequestConflict,
        message: 'Input property \'sender\' conflicts with path parameter'
      })
    })
  })
})

describe('response', () => {
  it('should return 404 on StateNotFound', async () => {
    const sender = newid()
    const id = newid()
    const url = locator('/messages/' + sender + '/' + id + '/')
    const response = await fetch(url)

    expect(response.status).toBe(404)
  })

  it('should return 201 on transition without query', async () => {
    const sender = newid()
    const url = locator('/messages/' + sender + '/')

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ text: 'foo' }),
      headers: { 'content-type': 'application/json' }
    })

    const reply = await response.json()

    expect(response.status).toBe(201)
    expect(reply.output.id).toStrictEqual(expect.any(String))
  })

  it('should return 500 on user space exception', async () => {
    const sender = newid()
    const url = locator('/messages/' + sender + '/')

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ text: 'throw exception' }),
      headers: { 'content-type': 'application/json' }
    })

    expect(response.status).toBe(500)

    const reply = await response.json()

    expect(reply).toStrictEqual({
      code: codes.System,
      message: 'User space exception',
      stack: expect.any(String)
    })
  })

  it('should return 412 on version mismatch', async () => {
    const sender = newid()
    const url = locator('/messages/' + sender + '/')

    const created = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ text: 'foo' }),
      headers: { 'content-type': 'application/json' }
    })

    expect(created.status).toBe(201)

    const { output } = await created.json()

    const failed = await fetch(url + output.id + '/', {
      method: 'PUT',
      body: JSON.stringify({ sender, text: 'bar' }),
      headers: {
        'content-type': 'application/json',
        'if-match': '"3"'
      }
    })

    expect(failed.status).toBe(412)
  })
})

describe('etag', () => {
  it('should create etag from _version', async () => {
    const url = locator('/credits/balance/' + newid() + '/')
    const response = await fetch(url)

    expect(response.headers.get('etag')).toBe('"0"')
  })

  // it('should use etag as query.version', async () => {
  //   const url = 'http://localhost:8000/credits/balance/' + newid() + '/'
  //   const response = await fetch(url, {
  //     headers: {
  //       'if-match': '"1"'
  //     }
  //   })
  //
  //   expect(response.status).toBe(412)
  // })
})
