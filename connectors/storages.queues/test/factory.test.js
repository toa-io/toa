'use strict'

const { Factory } = require('../')

it('should be', async () => {
  expect(Factory).toBeDefined()
})

/** @type {toa.core.storages.Factory} */
let factory

beforeEach(() => {
  factory = new Factory()
})

describe('storage', () => {
  it('should be', async () => {
    expect(factory.storage).toBeDefined()
  })
})
