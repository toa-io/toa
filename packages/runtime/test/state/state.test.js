'use strict'

const { State } = require('../../src/state/state')
const fixtures = require('./state.fixtures')

let state

beforeEach(() => {
  jest.clearAllMocks()

  state = new State(fixtures.storage, fixtures.entity)
})

it('should provide object', async () => {
  const object = await state.object(fixtures.query)

  expect(fixtures.storage.get).toHaveBeenCalledWith(fixtures.query)
  expect(object).toStrictEqual(fixtures.storage.get.mock.results[0].value)
})

it('should provide collection', async () => {
  const collection = await state.collection(fixtures.query)

  expect(fixtures.storage.find).toHaveBeenCalledWith(fixtures.query)
  expect(collection).toStrictEqual(fixtures.storage.find.mock.results[0].value)
})

it('should persist', async () => {
  const entity = fixtures.entity.create({ foo: 'bar' })

  await state.persist(entity)

  expect(fixtures.storage.upsert).toHaveBeenCalledWith(entity)
})
