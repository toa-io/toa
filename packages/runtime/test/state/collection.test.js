'use strict'

const { Collection } = require('../../src/state/collection')
const fixtures = require('./collection.fixtures')

let collection

beforeEach(() => {
  jest.clearAllMocks()

  collection = new Collection(fixtures.storage, fixtures.entity)
})

it('should provide object', async () => {
  const coll = await collection.query(fixtures.query)

  expect(fixtures.storage.find).toHaveBeenCalledWith(fixtures.query)
  expect(coll).toStrictEqual(fixtures.storage.find.mock.results[0].value)
})
