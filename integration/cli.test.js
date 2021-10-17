'use strict'

const { newid } = require('@toa.io/gears')
const framework = require('./framework')

const credits = framework.cli('credits')

it('should print help', async () => {
  const result = await credits()

  expect(result.stderr).toMatch(/^toa <command>/)
})

it('should invoke', async () => {
  const request = { query: { id: newid() } }
  const { stdout } = await credits('invoke', 'observe', request)

  expect(stdout).toMatch(/balance: \d+/)
})
