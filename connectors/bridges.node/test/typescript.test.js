import { it, describe, before } from 'node:test'
import assert from 'node:assert/strict'

import { resolve } from 'node:path'
import { generate } from 'randomstring'
import { Connector } from '@toa.io/core'

import * as define from '../src/define/index.js'
import { Factory } from '../src/factory.js'
import { calls } from './dummies/typescript/rc/phases.ts'

const root = resolve(import.meta.dirname, 'dummies/typescript')

let factory

const context = new Connector()
const input = generate()
const state = generate()

context.aspects = []

before(() => {
  factory = new Factory()
})

describe('define', () => {
  // the syntax is read back from the loaded function, whose types Node has erased
  it('should define an operation of each syntax', async () => {
    const operations = await define.operations(root)

    for (const name of ['fn', 'cls', 'fct'])
      assert.deepStrictEqual(operations[name], { type: 'transition', scope: 'object' })
  })

  it('should define an event', async () => {
    const events = await define.events(root)

    assert.deepStrictEqual(events.done.conditioned, true)
  })
})

describe('factory', () => {
  for (const sample of ['fn', 'cls', 'fct'])
    it(`should create '${sample}' operation`, async () => {
      const algorithm = await factory.algorithm(root, sample, context)

      await algorithm.connect()

      const response = await algorithm.execute(input, state)

      assert.deepStrictEqual(response.output, { input, state, context: true })
    })

  it('should create an event, a receiver and a guard', async () => {
    assert.notStrictEqual(await factory.event(root, 'done', context), undefined)
    assert.notStrictEqual(await factory.receiver(root, 'store.orders.created'), undefined)
    assert.notStrictEqual(await factory.guard(root, 'less', context), undefined)
  })

  it('should run the run commands', async () => {
    const { preflight, settle, dispose } = await factory.rc(root, context)

    calls.length = 0

    await preflight.connect()
    await settle.connect()
    await dispose.connect()
    await dispose.disconnect()

    assert.deepStrictEqual(calls, ['preflight', 'settle', 'dispose'])
  })
})
