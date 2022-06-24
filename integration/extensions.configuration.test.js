'use strict'

const framework = require('./framework')

let composition
let remote

beforeAll(async () => {
  composition = await framework.compose(['configured'])
  remote = await framework.remote('dummies.configured')
})

afterAll(async () => {
  if (remote) await remote.disconnect()
  if (composition) await composition.disconnect()
})

it('should connect', () => {
  expect(1).toBe(1)
})
