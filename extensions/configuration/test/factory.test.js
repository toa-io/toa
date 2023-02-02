'use strict'

const { Factory } = require('../')

it('should export', () => {
  expect(Factory).toBeInstanceOf(Function)
})

/** @type {toa.extensions.configuration.Factory} */
let factory

beforeAll(async () => {
  factory = new Factory()
})

it('should expose context', () => {
  expect(factory.aspect).toBeInstanceOf(Function)
})

it('should expose provider', () => {
  expect(factory.provider).toBeInstanceOf(Function)
})
