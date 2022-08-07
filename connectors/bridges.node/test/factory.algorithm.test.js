'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')

const { Factory } = require('../src/factory')

const root = resolve(__dirname, 'dummies/one')

let factory

const context = generate()
const input = generate()
const state = generate()

beforeAll(() => {
  factory = new Factory()
})

it('should be', () => {
  expect(factory.algorithm).toBeDefined()
})

for (const sample of ['fn', 'o-fn', 'cls', 'o-cls', 'fct', 'o-fct']) {
  it(`should create '${sample}' operation`, async () => {
    const algorithm = factory.algorithm(root, sample, context)

    expect(algorithm).toBeDefined()

    const promise = algorithm.run(input, state)

    await expect(promise).resolves.not.toThrow()

    const response = await promise

    expect(response.output).toStrictEqual({ input, state, context: true })
  })
}
