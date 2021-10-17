'use strict'

const fetch = require('node-fetch')
const { timeout, newid } = require('@toa.io/gears')
const { exceptions: { codes } } = require('@toa.io/core')
const extension = require('../extensions/resources')

const framework = require('./framework')

let resources, composition, a

const locator = (path) => 'http://localhost:8000' + path

beforeAll(async () => {
  composition = await framework.compose(['messages', 'stats', 'credits'])
  resources = await (new extension.Factory()).process()

  await resources.connect()
  await timeout(100) // resources discovery
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
    const url = locator('/stats/stats/' + id + '/')

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
    const url = locator('/stats/stats/' + id + '/')

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ foo: 'bar' }),
      headers: { 'content-type': 'application/json' }
    })

    expect(response.status).toBe(405)
  })
})

describe('response', () => {
  it('should return 404 on StateNotFound', async () => {
    const id = newid()
    const url = locator('/messages/messages/' + id + '/')
    const response = await fetch(url)

    expect(response.status).toBe(404)
  })

  it('should return 201 on transition without query', async () => {
    const sender = newid()
    const url = locator('/messages/messages/')

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ sender, text: 'foo' }),
      headers: { 'content-type': 'application/json' }
    })

    const reply = await response.json()

    expect(response.status).toBe(201)
    expect(reply.output.id).toStrictEqual(expect.any(String))
  })

  it('should return 500 on user space exception', async () => {
    const sender = newid()
    const url = locator('/messages/messages/')

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ sender, text: 'throw exception' }),
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
