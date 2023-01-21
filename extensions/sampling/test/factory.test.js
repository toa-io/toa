'use strict'

const { Factory } = require('../')

it('should be', () => {
  expect(Factory).toBeDefined()
})

/** @type {toa.core.extensions.Factory} */
const factory = new Factory()

it('should implement component', () => {
  expect(factory.component).toBeDefined()
})

it('should implement context', () => {
  expect(factory.context).toBeDefined()
})

it('should implement storage', () => {
  expect(factory.storage).toBeDefined()
})

it('should implement emitter', () => {
  expect(factory.emitter).toBeDefined()
})

it('should implement receiver', () => {
  expect(factory.receiver).toBeDefined()
})
