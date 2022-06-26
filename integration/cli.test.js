'use strict'

const { newid } = require('@toa.io/libraries/generic')
const framework = require('./framework')

const cli = framework.cli('./dummies/credits')

it('should print help', async () => {
  const result = await cli('--help')

  expect(result.stdout).toMatch(/^toa <command>/)
})

it('should print manifest', async () => {
  const result = await cli('export component')

  expect(result.stdout).toMatch(/^domain: credits/)
})

it('should invoke', async () => {
  const request = JSON.stringify({ query: { id: newid() } })
  const { stdout } = await cli(`invoke observe '${request}'`)

  expect(stdout).toMatch(/balance: 10/)
})
