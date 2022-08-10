'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')

const { Factory } = require('../src/factory')

const root = resolve(__dirname, 'dummies/one')

let factory

const context = new Connector()
const input = generate()
const state = generate()

context.extensions = []

beforeAll(() => {
  factory = new Factory()
})

it('should be', () => {
  expect(factory.algorithm).toBeDefined()
})

for (const sample of ['fn', 'cls', 'fct']) {
  it(`should create '${sample}' operation`, async () => {
    const algorithm = factory.algorithm(root, sample, context)

    expect(algorithm).toBeDefined()

    await algorithm.connect()

    const promise = algorithm.run(input, state)

    await expect(promise).resolves.not.toThrow()

    const response = await promise

    expect(response.output).toStrictEqual({ input, state, context: true })
  })
}
