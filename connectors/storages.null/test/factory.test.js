'use strict'

const { Factory } = require('../src/factory')
const { Storage } = require('../src/storage')

let factory

beforeAll(() => {
  factory = new Factory()
})

it('should create storage', () => {
  const storage = factory.storage()

  expect(storage).toBeInstanceOf(Storage)
})
