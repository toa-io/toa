'use strict'

const { newid } = require('@toa.io/generic')
const framework = require('./framework')

const cli = framework.cli('./dummies/credits')

beforeAll(() => {
  process.env.FORCE_COLOR=0;
  framework.dev(true)
})

afterAll(() => {
  process.env.FORCE_COLOR=2;
  framework.dev(false)
})

it('should invoke', async () => {
  const request = JSON.stringify({ query: { id: newid() } })
  const { stdout } = await cli(`invoke observe '${request}'`)

  expect(stdout).toContain('balance: 10')
})
