'use strict'

const { timeout, newid } = require('@toa.io/gears')

const framework = require('./framework')
const { codes } = require('@toa.io/core/src/exceptions')

let composition, remote

beforeAll(async () => {
  composition = await framework.compose(['initialized'])
  remote = await framework.remote('dummies.initialized')
})

afterAll(async () => {
  await timeout(500) // process all events

  if (remote) await remote.disconnect()
  if (composition) await composition.disconnect()
})

it('should upsert', async () => {
  const id = newid()
  await remote.invoke('assign', { input: { a: 1, b: 'foo' }, query: { id } })

  const upserted = await remote.invoke('observe', { query: { id } })

  expect(upserted.output).toStrictEqual({ id, _version: 1, a: 1, b: 'foo' })

  await remote.invoke('assign', { input: { a: 2 }, query: { id } })

  const updated = await remote.invoke('observe', { query: { id } })

  expect(updated.output).toStrictEqual({ id, _version: 2, a: 2, b: 'foo' })
})

it('should not upsert if not match entity schema', async () => {
  const id = newid()

  await expect(remote.invoke('assign', { input: { a: 1 }, query: { id } }))
    .rejects.toMatchObject({ code: codes.StateNotFound })
})
