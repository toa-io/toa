'use strict'

const { newid } = require('@toa.io/generic')
const framework = require('./framework')

const cli = framework.cli('./dummies/credits')

beforeAll(() => {
  framework.env('toa_local')
})

afterAll(() => {
  framework.env()
})

it('should invoke', async () => {
  const request = JSON.stringify({ query: { id: newid() } })
  const { stdout } = await cli(`invoke observe '${request}'`)

  expect(stdout).toMatch(/balance: 10/)
})
