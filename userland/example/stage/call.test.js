'use strict'

const { resolve } = require('node:path')
const { exceptions: { RequestContractException } } = require('@toa.io/core')
const stage = require('@toa.io/userland/stage')

const root = resolve(__dirname, '../components')

/** @type {toa.core.Component} */
let remote

beforeAll(async () => {
  const path = resolve(root, 'echo')

  await stage.composition([path])

  remote = await stage.remote('echo')
})

afterAll(async () => {
  await stage.shutdown()
})

it('should call endpoint', async () => {
  const reply = await remote.invoke('signal', {})

  expect(reply.output).toStrictEqual('quack')
})

it('should throw on invalid input', async () => {
  const a = 'not a number'
  const b = 'neither'

  await expect(remote.invoke('add', { input: { a, b } }))
    .rejects.toBeInstanceOf(RequestContractException)
})
