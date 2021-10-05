'use strict'

const framework = require('./framework')

const credits = framework.cli('credits')

it('should print help', async () => {
  const result = await credits()

  expect(result.stderr).toMatch(/^kookaburra <command>/)
})

it('should invoke', async () => {
  const request = { input: 1 }
  const { stdout } = await credits('invoke', 'deduce', request)

  expect(stdout).toMatch(/{ output: \d+ }$/)
})
