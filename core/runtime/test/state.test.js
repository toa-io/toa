'use strict'

const { State } = require('../src/state')
const fixtures = require('./state.fixtures')

let state

beforeEach(() => {
  jest.clearAllMocks()

  state = new State(fixtures.storage, fixtures.entity)
})

it('should provide object', async () => {
  const entry = await state.entry(fixtures.query)

  expect(fixtures.storage.get).toHaveBeenCalledWith(fixtures.query)
  expect(entry).toStrictEqual(fixtures.entity.entry.mock.results[0].value)
  expect(fixtures.entity.entry).toHaveBeenCalledWith(fixtures.storage.get.mock.results[0].value)
})

it('should provide collection', async () => {
  const collection = await state.set(fixtures.query)

  expect(fixtures.storage.find).toHaveBeenCalledWith(fixtures.query)
  expect(collection).toStrictEqual(fixtures.entity.set.mock.results[0].value)
  expect(fixtures.entity.set).toHaveBeenCalledWith(fixtures.storage.find.mock.results[0].value)
})

it('should add blank entry', async () => {
  await state.commit(fixtures.blank)

  expect(fixtures.storage.add).toHaveBeenCalledWith(fixtures.blank.get.mock.results[0].value)
})

it('should update entry', async () => {
  await state.commit(fixtures.entry)

  expect(fixtures.storage.update).toHaveBeenCalledWith(fixtures.entry.get.mock.results[0].value)
})
