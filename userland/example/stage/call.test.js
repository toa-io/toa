'use strict'

const { resolve } = require('node:path')
const { exceptions: { RequestContractException } } = require('@toa.io/core')
const stage = require('@toa.io/userland/stage')

const root = resolve(__dirname, '../components')

/** @type {toa.core.Component} */
let remote

beforeAll(async () => {
  const path = resolve(root, 'math/calculations')

  await stage.composition([path])

  remote = await stage.remote('math.calculations')
})

afterAll(async () => {
  await stage.shutdown()
})

it('should call endpoint', async () => {
  const a = Math.random()
  const b = Math.random()

  const reply = await remote.invoke('add', { input: { a, b } })

  expect(reply.output).toStrictEqual(a + b)
})

it('should throw on invalid input', async () => {
  const a = 'not a number'
  const b = 'neither'

  await expect(remote.invoke('add', { input: { a, b } }))
    .rejects.toBeInstanceOf(RequestContractException)
})
