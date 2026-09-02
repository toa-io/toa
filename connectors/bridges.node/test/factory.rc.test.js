import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'

import { Factory } from '../src/factory.js'
import { calls } from './dummies/rc/rc/phases.js'

const root = resolve(import.meta.dirname, 'dummies/rc')

let factory
let context

beforeEach(() => {
  factory = new Factory()
  context = new Connector()
  context.aspects = []
  calls.length = 0
})

it('should create a connector per exported phase', async () => {
  const phases = await factory.rc(root, context)

  assert.notStrictEqual(phases.preflight, undefined)
  assert.notStrictEqual(phases.settle, undefined)
  assert.notStrictEqual(phases.dispose, undefined)
})

it('should run startup phases on connection', async () => {
  const phases = await factory.rc(root, context)

  await phases.preflight.connect()
  await phases.settle.connect()

  assert.deepStrictEqual(calls, ['preflight', 'settle'])
})

it('should not run disposal on connection', async () => {
  const phases = await factory.rc(root, context)

  await phases.dispose.connect()

  assert.deepStrictEqual(calls, [])
})

it('should run disposal on disconnection', async () => {
  const phases = await factory.rc(root, context)

  await phases.dispose.connect()
  await phases.dispose.disconnect()

  assert.deepStrictEqual(calls, ['dispose'])
})

it('should reject an RC exporting no phase', async () => {
  const promise = factory.rc(resolve(import.meta.dirname, 'dummies/rc.none'), context)

  await assert.rejects(promise, (error) => /RC 'empty' must export preflight, settle and\/or dispose/.test(error.message))
})
