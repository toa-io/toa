'use strict'

const { it, before } = require('node:test')
const assert = require('node:assert/strict')

const { resolve } = require('node:path')
const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')

const { Factory } = require('../src/factory')

const root = resolve(__dirname, 'dummies/one')

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
