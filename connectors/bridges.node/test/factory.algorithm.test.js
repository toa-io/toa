import { it, before } from 'node:test'
import assert from 'node:assert/strict'

import { resolve } from 'node:path'
import { generate } from 'randomstring'
import { Connector } from '@toa.io/core'

import { Factory } from '../src/factory.js'

const root = resolve(import.meta.dirname, 'dummies/one')

let factory

const context = new Connector()
const input = generate()
const state = generate()

context.aspects = []

before(() => {
  factory = new Factory()
})

it('should be', () => {
  assert.notStrictEqual(factory.algorithm, undefined)
})

for (const sample of ['fn', 'cls', 'fct']) {
  it(`should create '${sample}' operation`, async () => {
    const algorithm = await factory.algorithm(root, sample, context)

    assert.notStrictEqual(algorithm, undefined)

    await algorithm.connect()

    const promise = algorithm.execute(input, state)

    await assert.doesNotReject(promise)

    const response = await promise

    assert.deepStrictEqual(response.output, { input, state, context: true })
  })
}
