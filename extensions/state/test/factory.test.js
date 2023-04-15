'use strict'

const { Factory } = require('../')

it('should be', async () => {
  expect(Factory).toBeInstanceOf(Function)
})

/** @type {Factory} */
let factory

beforeEach(() => {
  factory = new Factory()
})

it('should implement aspect()', async () => {
  expect(factory.aspect).toBeInstanceOf(Function)
})
