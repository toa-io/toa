'use strict'

const fetch = require('node-fetch')
const { timeout, newid, random, repeat } = require('@toa.io/generic')
const { exceptions: { codes } } = require('@toa.io/core')
const boot = require('@toa.io/boot')
const extension = require('../extensions/exposition')

const framework = require('./framework')

let resources, composition, a

const locator = (path) => 'http://localhost:8000' + path

beforeAll(async () => {
  framework.env('local')

  composition = await framework.compose(['messages', 'stats', 'credits'])
  resources = (new extension.Factory(boot)).service()

  await resources.connect()
  await timeout(200) // resources discovery
})

afterAll(async () => {
  if (resources) await resources.disconnect()
  if (a) await a.disconnect()
  if (composition) await composition.disconnect()

  framework.env()
})

describe('routing', () => {
  it('should expose routes', async () => {
    const id = newid()
    const url = locator('/credits/balance/' + id + '/')
    const response = await fetch(url)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json).toStrictEqual({ output: { id, balance: 10 } })
  })

  it('should expose routes dynamically', async () => {
    const id = newid()
    const url = locator('/dummies/a/' + id + '/')

    const before = await fetch(url)

    if (before.status === 500) {
      // shutdown Kind deployment and run `docker compose restart`
      process.exit(1)
    }

    expect(before.status).toBe(404)

    a = await framework.compose(['a'])

    await a.connect()
    await timeout(200) // expose resources

    const after = await fetch(url)

    expect(after.status).toBe(200)
  })

  it('should update routes', async () => {
    const id = newid()
    const url = locator('/dummies/a/v2/' + id + '/')

    if (a === undefined) {
      a = await framework.compose(['a'])

      await a.connect()
      await timeout(200) // expose resources
    }

    const before = await fetch(url)

    expect(before.status).toBe(404)

    await a.disconnect()

    const v2 = await framework.compose(['a.v2'])
    await v2.connect()
    await timeout(200) // expose v2

    const after = await fetch(url)

    expect(after.status).toBe(200)

    await v2.disconnect()
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

  it('should map assignment as PATCH', async () => {
    const id = newid()
    const url = locator('/credits/balance/' + id + '/')

    const response = await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify({ balance: 30 }),
      headers: { 'content-type': 'application/json' }
    })

    expect(response.status).toBe(204)
  })
})

describe('request', () => {
  it('should return 400 on invalid query', async () => {
    const url = locator('/credits/balance/' + newid() + '/?foo=bar')
    const response = await fetch(url)

    expect(response.status).toBe(400)

    const reply = await response.json()

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

  it('should not return body on head', async () => {
    const id = newid()
    const url = locator('/credits/balance/' + id + '/')
    const response = await fetch(url, { method: 'HEAD' })
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(text).toBe('')
    expect(response.headers.get('content-length')).toBe('65')
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
        body: JSON.stringify({ sender, text: 'bar' }),
        headers: {
          'content-type': 'application/json',
          'if-match': 'foo'
        }
      })

      const body = await response.json()

      expect(response.status).toBe(400)

      expect(body).toStrictEqual({
        code: codes.RequestSyntax,
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

      expect(response.status).toBe(400)

      const body = await response.json()

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
      const response = await fetch(urls.message, {
        method: 'PUT',
        body: JSON.stringify({ sender, text: 'baz' }),
        headers: {
          'content-type': 'application/json',
          'if-match': '*'
        }
      })

      expect(response.status).toBe(200)
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

  describe('query', () => {
    const sender = newid()
    const url = locator('/messages/' + sender + '/')

    it('should return 400 on malformed criteria', async () => {
      const response = await fetch(`${url}?criteria=foo!`)

      expect(response.status).toBe(400)

      const body = await response.json()

      expect(body).toStrictEqual({
        code: codes.QuerySyntax,
        message: expect.stringContaining('Unexpected character \'!\'')
      })
    })

    it('should return 400 on undefined criteria selector', async () => {
      const response = await fetch(url + '?criteria=foo==1')

      expect(response.status).toBe(400)

      const body = await response.json()

      expect(body).toStrictEqual({
        code: codes.QuerySyntax,
        message: expect.stringContaining('Criteria selector \'foo\'')
      })
    })

    it('should return 400 on malformed omit', async () => {
      const response = await fetch(url + '?omit=foo')

      expect(response.status).toBe(400)

      const body = await response.json()

      expect(body).toStrictEqual({
        code: codes.RequestContract,
        keyword: 'type',
        property: 'query/omit',
        path: '/query/omit',
        schema: '#/properties/query/properties/omit/type',
        message: 'query/omit must be integer'
      })
    })

    it('should return 400 on malformed limit', async () => {
      const response = await fetch(url + '?limit=foo')

      expect(response.status).toBe(400)

      const body = await response.json()

      expect(body).toStrictEqual({
        code: codes.RequestContract,
        keyword: 'type',
        property: 'query/limit',
        path: '/query/limit',
        schema: '#/properties/query/properties/limit/type',
        message: 'query/limit must be integer'
      })
    })

    describe('exact omit, limit', () => {
      const url = locator('/messages/query/fixed/set/')

      it('should return 403 on exact limit violation', async () => {
        const response = await fetch(url + '?limit=19')

        expect(response.status).toBe(403)
      })
    })

    it('should return 400 on malformed projection', async () => {
      const response = await fetch(url + '?projection=100')

      expect(response.status).toBe(400)

      const body = await response.json()

      expect(body).toStrictEqual({
        code: codes.RequestContract,
        keyword: 'pattern',
        property: 'query/projection/0',
        path: '/query/projection/0',
        schema: '#/properties/query/properties/projection/items/pattern',
        message: expect.stringContaining('query/projection/0 must match pattern')
      })
    })

    it('should return 400 on undefined projection property', async () => {
      const response = await fetch(url + '?projection=foo')

      expect(response.status).toBe(400)

      const body = await response.json()

      expect(body).toStrictEqual({
        code: codes.QuerySyntax,
        message: 'Projection property \'foo\' is not defined'
      })
    })

    it('should return 400 on malformed sort', async () => {
      const response = await fetch(url + '?sort=100')

      expect(response.status).toBe(400)

      const body = await response.json()

      expect(body).toStrictEqual({
        code: codes.RequestContract,
        keyword: 'pattern',
        property: 'query/sort/1',
        path: '/query/sort/1',
        schema: '#/properties/query/properties/sort/items/pattern',
        message: expect.stringContaining('query/sort/1 must match pattern')
      })
    })

    it('should return 400 on undefined sort property', async () => {
      const response = await fetch(url + '?sort=foo:desc')

      expect(response.status).toBe(400)

      const body = await response.json()

      expect(body).toStrictEqual({
        code: codes.QuerySyntax,
        message: 'Sort property \'foo\' is not defined'
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

  it('should return 204 on empty response', async () => {
    const url = locator('/credits/balance/' + newid() + '/')

    const response = await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify({ balance: 5 }),
      headers: { 'content-type': 'application/json' }
    })

    expect(response.status).toBe(204)
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

  it('should create etag from _version', async () => {
    const url = locator('/credits/balance/' + newid() + '/')
    const response = await fetch(url)

    expect(response.headers.get('etag')).toBe('"0"')
  })

  describe('query', () => {
    const times = 5 + random(5)
    const sender = newid()
    const url = locator('/messages/' + sender + '/')

    beforeAll(async () => {
      let index = 0

      const send = async () => {
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({ text: 'foo', timestamp: index++ }),
          headers: { 'content-type': 'application/json' }
        })

        expect(response.status).toBe(201)
      }

      await repeat(send, times)
    })

    it('should return projection', async () => {
      const response = await fetch(url + '?projection=timestamp')

      expect(response.status).toBe(200)

      const { output } = await response.json()

      expect(output.length).toBe(times)

      for (const message of output) {
        expect(message.text).toBeUndefined()
        expect(message.timestamp).toStrictEqual(expect.any(Number))
      }
    })

    it('should return sorted', async () => {
      const url = locator(`/messages/query/unsorted/set/?criteria=sender==${sender}&sort=timestamp:desc`)
      const response = await fetch(url)

      expect(response.status).toBe(200)

      const { output } = await response.json()

      expect(output.length).toBe(times)

      let previous

      for (const message of output) {
        if (previous !== undefined) {
          expect(message.timestamp < previous?.timestamp).toBe(true)
        }

        previous = message
      }
    })

    it('should select with omit, limit', async () => {
      // omit + limit must be less than times in context of this test
      const omit = random(2)
      const limit = 1 + random(2)
      const response = await fetch(`${url}?omit=${omit}&limit=${limit}`)

      expect(response.status).toBe(200)

      const { output } = await response.json()

      expect(output.length).toBe(limit)

      let count = 0

      for (const message of output) {
        count++
        expect(message.timestamp).toBe(times - omit - count)
      }
    })

    it('should select with criteria', async () => {
      const response = await fetch(`${url}?criteria=timestamp<4`)

      expect(response.status).toBe(200)

      const { output } = await response.json()

      expect(output.length).toBe(4)
    })
  })

  describe('cors', () => {
    it('should implement preflight', async () => {
      const url = locator('/credits/balance/' + newid() + '/')

      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          origin: 'https://origin',
          'access-control-request-headers': 'content-type',
          'access-control-request-method': 'PUT'
        }
      })

      expect(response.status).toStrictEqual(204)
      expect(response.headers.get('access-control-allow-origin')).toStrictEqual('*')
      expect(response.headers.get('access-control-allow-methods')).toStrictEqual('GET,HEAD,PUT,PATCH,POST,DELETE')
      expect(response.headers.get('access-control-allow-headers')).toStrictEqual('content-type')
      expect(response.headers.get('vary')).toStrictEqual(null)
    })

    it('should allow actual requests', async () => {
      const url = locator('/credits/balance/' + newid() + '/')

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          origin: 'https://origin'
        },
        body: JSON.stringify({ input: { balance: 20 } })
      })

      expect(response.status).toStrictEqual(405)
      expect(response.headers.get('access-control-allow-origin')).toStrictEqual('*')
    })
  })
})
