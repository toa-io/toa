'use strict'

const { id } = require('../runtime/core/src/id')
const framework = require('./framework')

const credits = framework.cli('credits')

it('should print help', async () => {
  const result = await credits()

  expect(result.stderr).toMatch(/^kookaburra <command>/)
})

it('should invoke', async () => {
  const request = { query: { id: id() } }
  const { stdout } = await credits('invoke', 'observe', request)

  expect(stdout).toMatch(/balance: \d+/)
})
