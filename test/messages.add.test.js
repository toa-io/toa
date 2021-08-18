'use strict'

const randomstring = require('randomstring')

const lab = require('./lab')

let env
let runtime

beforeAll(async () => {
  env = await lab.setup()
  runtime = lab.runtime('messages')
})

afterAll(async () => {
  await lab.teardown()
})

it('should add message', async () => {
  const message = { text: randomstring.generate() }
  const { ok, oh } = await runtime.invoke('add', message)

  expect(ok).toBeDefined()
  expect(oh).not.toBeDefined()

  const result = await env.db.db('messages').collection('messages').findOne()

  expect(result).toBeDefined()
  expect(result).toMatchObject(message)
  expect(typeof result._id).toBe('string')
})

it('should throw on invalid input', async () => {
  const { ok, oh } = await runtime.invoke('add', { oops: 'nope' })

  expect(ok).not.toBeDefined()
  expect(oh).toBeDefined()
})
