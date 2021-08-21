'use strict'

const randomstring = require('randomstring')

const lab = require('./lab')

let env, collection, runtime

beforeAll(async () => {
  env = await lab.setup()
  collection = env.db.db('messages').collection('messages')
  runtime = lab.runtime('messages')
})

afterAll(async () => {
  await lab.teardown()
})

afterEach(async () => {
  await collection.deleteMany()
})

it('should add message', async () => {
  const message = { text: randomstring.generate() }
  const { ok, oh } = await runtime.invoke('add', message)

  expect(ok).toBeDefined()
  expect(oh).not.toBeDefined()

  expect(typeof ok.output.output.id).toBe('string')

  const result = await collection.findOne()

  expect(result).toBeDefined()
  expect(result).toMatchObject(message)
  expect(typeof result._id).toBe('string')
  expect(result._id).toBe(ok.output.output.id)
})

it('should throw on invalid input', async () => {
  const { ok, oh } = await runtime.invoke('add', { oops: 'nope' }, null, true)

  expect(ok).not.toBeDefined()
  expect(oh).toBeDefined()
})

it('should get message', async () => {
  const message = { text: randomstring.generate() }
  const { ok: { output: { output: created } } } = await runtime.invoke('add', message)

  const { ok: { output: { output } } } = await runtime.invoke('get', null, `{criteria:'id==${created.id}'}`)

  expect(output.id).toBe(created.id)
})

it('should throw when input is not null', async () => {
  const { ok, oh } = await runtime.invoke('get', { not: 'null' }, '{criteria:id==1}', true)

  expect(ok).not.toBeDefined()
  expect(oh).toBeDefined()
})

it('should update message', async () => {
  const message = { text: randomstring.generate() }
  const { ok: { output: { output: created } } } = await runtime.invoke('add', message)

  const update = { text: randomstring.generate() }
  await runtime.invoke('update', update, `{criteria:'id==${created.id}'}`)

  const { ok: { output: { output } } } = await runtime.invoke('get', null, `{criteria:'id==${created.id}'}`)

  expect(output.id).toBe(created.id)
  expect(output.text).toBe(update.text)
})
