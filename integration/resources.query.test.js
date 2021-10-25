'use strict'

const fetch = require('node-fetch')
const { newid, repeat, timeout } = require('@toa.io/gears')

const framework = require('./framework')
const extension = require('../extensions/resources')
const { generate } = require('randomstring')
const { codes } = require('@toa.io/core/src/exceptions')

let resources, composition

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
})

describe('criteria', () => {
  it('should apply', async () => {
    const sender = newid()
    const times = 10
    const url = locator('/messages/' + sender + '/')

    await repeat(async (i) => {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ text: generate(), deleted: i % 2 === 0 }),
        headers: { 'content-type': 'application/json' }
      })

      expect(response.status).toBe(201)
    }, times)

    const response = await fetch(url)

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.output.length).toBe(times / 2)
  })

  it('should throw RequestConflict if closed', async () => {
    const url = locator('/messages/bad/queries/' + newid() + '/?criteria=sender==1')
    const response = await fetch(url)

    expect(response.status).toBe(403)

    const json = await response.json()

    expect(json).toMatchObject({ code: codes.RequestConflict })
  })

  it('should append if open', async () => {
    const sender = newid()
    const times = 10
    const url = locator('/messages/' + sender + '/')

    await repeat(async (i) => {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ text: generate(), deleted: i % 2 === 0, timestamp: i }),
        headers: { 'content-type': 'application/json' }
      })

      expect(response.status).toBe(201)
    }, times)

    const response = await fetch(url + '?criteria=timestamp<4')

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.output.length).toBe(2)
  })

  it('should forbid closed empty criteria', async () => {
    const url = locator('/messages/query/criteria/closed/')

    const ok = await fetch(url)

    expect(ok.status).toBe(200)

    const response = await fetch(url + '?criteria=timestamp<4')

    expect(response.status).toBe(403)
  })
})

describe('omit, limit', () => {
  it('should throw if out of boundaries', async () => {
    const url = locator('/messages/' + newid() + '/')

    await expect(fetch(url + '?limit=21')).resolves.toMatchObject({ status: 403 })
    await expect(fetch(url + '?limit=0')).resolves.toMatchObject({ status: 403 })
    await expect(fetch(url + '?omit=11')).resolves.toMatchObject({ status: 403 })
    await expect(fetch(url + '?omit=0')).resolves.toMatchObject({ status: 403 })
  })
})

describe('sort', () => {
  it('should throw if closed', async () => {
    const url = locator('/messages/')
    await expect(fetch(url + '?sort=id')).resolves.toMatchObject({ status: 403 })
  })

  it('should append of right-open', async () => {
    const sender = newid()
    const times = 10
    const url = locator('/messages/' + sender + '/')

    await repeat(async (i) => {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ text: i, timestamp: 1 }),
        headers: { 'content-type': 'application/json' }
      })

      expect(response.status).toBe(201)
    }, times)

    const response = await fetch(url + '?sort=text:desc')

    expect(response.status).toBe(200)

    const json = await response.json()

    let previous

    for (const message of json.output) {
      if (previous === undefined) {
        previous = message
        continue
      }

      expect(message.text < previous.text).toBe(true)
    }
  })

  it('should prepend if left-open', async () => {
    const sender = newid()
    const times = 10
    const url = locator('/messages/' + sender + '/')

    await repeat(async (i) => {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ text: times - i, timestamp: i }),
        headers: { 'content-type': 'application/json' }
      })

      expect(response.status).toBe(201)
    }, times)

    const response = await fetch(locator(`/messages/query/left/open/?criteria=sender==${sender}&sort=text:desc`))

    expect(response.status).toBe(200)

    const json = await response.json()

    let previous

    for (const message of json.output) {
      if (previous === undefined) {
        previous = message
        continue
      }

      expect(message.text < previous.text).toBe(true)
    }
  })
})
