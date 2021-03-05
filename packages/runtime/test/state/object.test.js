'use strict'

const { Object } = require('../../src/state/object')
const fixtures = require('./object.fixtures')

let object

beforeEach(() => {
  jest.clearAllMocks()

  object = new Object(fixtures.storage, fixtures.entity)
})

it('should provide object', async () => {
  const obj = await object.query(fixtures.query)

  expect(fixtures.storage.get).toHaveBeenCalledWith(fixtures.query)
  expect(obj).toStrictEqual(fixtures.storage.get.mock.results[0].value)
})
