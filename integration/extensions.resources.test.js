'use strict'

const fetch = require('node-fetch')
const { timeout, newid } = require('@toa.io/gears')
const { exceptions: { codes } } = require('@toa.io/core')
const extension = require('../extensions/resources')

const framework = require('./framework')

let resources, credits, stats

const path = (path) => 'http://localhost:8000' + path

const composeStats = async () => {
  if (stats === undefined) {
    stats = await framework.compose(['stats', 'messages'])

    await stats.connect()
    await timeout(10) // resource exposition
  }

  return stats
}

beforeAll(async () => {
  credits = await framework.compose(['credits'])
  resources = await (new extension.Factory()).process()

  await resources.connect()
  await timeout(10) // resources discovery
})

afterAll(async () => {
  if (resources) await resources.disconnect()
  if (credits) await credits.disconnect()
  if (stats) await stats.disconnect()
})

describe('routing', () => {
  it('should expose routes', async () => {
    const id = newid()
    const url = path('/credits/balance/' + id + '/')
    const response = await fetch(url)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toStrictEqual({ output: { id, balance: 10 } })
  })

  it('should expose routes dynamically', async () => {
    const id = newid()
    const url = path('/stats/stats/' + id + '/')
    const before = await fetch(url)

    expect(before.status).toBe(404)

    stats = await composeStats()

    const after = await fetch(url)

    expect(after.status).toBe(200)
  })

  it('should return 404 on route mismatch', async () => {
    const url = path('/no/route/matches')
    const response = await fetch(url)

    expect(response.status).toBe(404)
  })

  it('should return 404 on node mismatch', async () => {
    const url = path('/credits/balance/no/node/matches')
    const response = await fetch(url)

    expect(response.status).toBe(404)
  })
})

describe('request', () => {
  it('should return 400 on invalid query', async () => {
    const url = path('/credits/balance/' + newid() + '/?foo=bar')
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
    const url = path('/stats/stats/' + id + '/')

    stats = await composeStats()

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
})

describe('etag', () => {
  it('should create etag from _version', async () => {
    const url = path('/credits/balance/' + newid() + '/')
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
