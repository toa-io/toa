'use strict'

const { it, before, after } = require('node:test')
const assert = require('node:assert/strict')

const { resolve } = require('node:path')
const { exceptions: { RequestContractException } } = require('@toa.io/core')
const stage = require('@toa.io/userland/stage')

const root = resolve(__dirname, '../components')

let echo
let math

before(async () => {
  process.env.TOA_DEV = '1'
  process.env.TOA_CONFIGURATION_DEFAULT_ECHO = '{}'
  process.env.TOA_CONFIGURATION_TEA_POTS = '{}'

  const paths = ['echo', 'math.calculations'].map((rel) => resolve(root, rel))

  await stage.composition(paths)

  echo = await stage.remote('echo')
  math = await stage.remote('math.calculations')
})

after(async () => {
  await stage.shutdown()

  delete process.env.TOA_DEV
})

it('should call endpoint', async () => {
  const reply = await echo.invoke('signal', {})

  assert.deepStrictEqual(reply, 'quack')
})

it('should throw on invalid input', async () => {
  const a = 'not a number'
  const b = 'neither'

  await assert.rejects(math.invoke('add', { input: { a, b } }), (error) => { assert.ok(error instanceof RequestContractException); return true })
})
