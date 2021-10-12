'use strict'

const { State } = require('../src/state')
const fixtures = require('./state.fixtures')

let state

beforeEach(() => {
  jest.clearAllMocks()

  state = new State(fixtures.storage, fixtures.entity, fixtures.emitter)
})

it('should provide entry', async () => {
  const entry = await state.entry(fixtures.query)

  expect(fixtures.storage.get).toHaveBeenCalledWith(fixtures.query)
  expect(entry).toStrictEqual(fixtures.entity.entry.mock.results[0].value)
  expect(fixtures.entity.entry).toHaveBeenCalledWith(fixtures.storage.get.mock.results[0].value)
})

it('should provide entries', async () => {
  const entries = await state.entries(fixtures.query)

  expect(fixtures.storage.find).toHaveBeenCalledWith(fixtures.query)
  expect(entries).toStrictEqual(fixtures.entity.entries.mock.results[0].value)
  expect(fixtures.entity.entries).toHaveBeenCalledWith(fixtures.storage.find.mock.results[0].value)
})

it('should store entry', async () => {
  await state.commit(fixtures.initial)

  expect(fixtures.storage.store).toHaveBeenCalledWith(fixtures.initial.get.mock.results[0].value)
})

it('should emit', async () => {
  await state.commit(fixtures.entry)

  expect(fixtures.emitter.emit).toHaveBeenCalledWith(fixtures.entry.event.mock.results[0].value)
})

it('should not emit if state has not been changed', async () => {
  await state.commit(fixtures.unchanged)

  expect(fixtures.emitter.emit).not.toHaveBeenCalled()
})
