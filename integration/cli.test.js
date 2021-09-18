'use strict'

const framework = require('./framework')

const credits = framework.cli('credits')
const messages = framework.cli('messages')

it('should print help', async () => {
  const result = await credits()

  expect(result.stderr).toMatch(/^kookaburra <command>/)
})

it('should invoke', async () => {
  const request = { input: { amount: 1 } }
  const { stdout } = await credits('invoke', 'deduce', request)

  expect(stdout).toMatch(/{ output: \d+ }$/)
})

it('should throw transmission exception on failed discovery', async () => {
  expect.assertions(2)

  try {
    await messages('invoke', 'add', { input: { sender: '1', text: 'foo' } })
  } catch (error) {
    expect(error.exitCode).toBe(1)
    expect(error.stderr).toMatch(/Transmission failed/)
  }
})
