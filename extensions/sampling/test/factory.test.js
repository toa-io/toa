'use strict'

const { Factory } = require('../')

it('should be', () => {
  expect(Factory).toBeDefined()
})

let factory

beforeEach(() => {
  factory = new Factory()
})

it('should implement component', () => {
  expect(factory.component).toBeDefined()
})
