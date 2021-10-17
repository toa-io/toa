'use strict'

const fetch = require('node-fetch')
const { timeout, newid } = require('@toa.io/gears')
const extension = require('../extensions/resources')

const framework = require('./framework')

let composition, resources

const path = (path) => 'http://localhost:8000' + path

beforeAll(async () => {
  composition = await framework.compose(['credits'])
  resources = await (new extension.Factory()).process()

  await resources.connect()
  await timeout(10) // resources discovery
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (resources) await resources.disconnect()
})

it('should get', async () => {
  const id = newid()
  const url = path('/credits/balance/' + id + '/')
  const response = await fetch(url)
  const json = await response.json()

  expect(response.status).toBe(200)
  expect(json).toStrictEqual({ output: { id, balance: 10 } })
})

describe('routing', () => {
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
