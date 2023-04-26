'use strict'

const { resolve } = require('node:path')
const { exceptions: { RequestContractException } } = require('@toa.io/core')
const stage = require('@toa.io/userland/stage')

const root = resolve(__dirname, '../components')

/** @type {toa.core.Component} */
let echo

/** @type {toa.core.Component} */
let math

beforeAll(async () => {
  const paths = ['echo', 'math/calculations'].map((rel) => resolve(root, rel))

  await stage.composition(paths)

  echo = await stage.remote('echo')
  math = await stage.remote('math.calculations')
})

afterAll(async () => {
  await stage.shutdown()
})

it('should call endpoint', async () => {
  const reply = await echo.invoke('signal', {})

  expect(reply.output).toStrictEqual('quack')
})

it('should throw on invalid input', async () => {
  const a = 'not a number'
  const b = 'neither'

  await expect(math.invoke('add', { input: { a, b } }))
    .rejects.toBeInstanceOf(RequestContractException)
})
