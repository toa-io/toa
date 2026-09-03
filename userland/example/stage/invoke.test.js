import { it, before, after } from 'node:test'
import assert from 'node:assert/strict'

import { resolve } from 'node:path'
import * as stage from '@toa.io/userland/stage'

const root = resolve(import.meta.dirname, '../components')

/** @type {toa.core.Component} */
let component

before(async () => {
  process.env.TOA_DEV = '1'
  process.env.TOA_CONFIGURATION_DEFAULT_ECHO = '{}'
  process.env.TOA_CONFIGURATION_TEA_POTS = '{}'

  const path = resolve(root, 'math.calculations')

  component = await stage.component(path)
})

after(async () => {
  await stage.shutdown()

  delete process.env.TOA_DEV
})

it('should invoke', async () => {
  const a = Math.random()
  const b = Math.random()

  const reply = await component.invoke('add', { input: { a, b } })

  assert.strictEqual(reply.exception, undefined)
  assert.deepStrictEqual(reply.output, a + b)
})
