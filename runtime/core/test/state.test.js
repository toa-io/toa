'use strict'

const { State } = require('../src/state')
const fixtures = require('./state.fixtures')

let state

beforeAll(() => {
  delete global.TOA_INTEGRATION_OMIT_EMISSION
})

afterAll(() => {
  global.TOA_INTEGRATION_OMIT_EMISSION = true
})

beforeEach(() => {
  jest.clearAllMocks()

  state = new State(fixtures.storage, fixtures.factory, fixtures.emitter)
})

it('should provide entity', async () => {
  const entity = await state.entity(fixtures.query)

  expect(fixtures.storage.get).toHaveBeenCalledWith(fixtures.query)
  expect(entity).toStrictEqual(fixtures.factory.entity.mock.results[0].value)
  expect(fixtures.factory.entity).toHaveBeenCalledWith(fixtures.storage.get.mock.results[0].value)
})

it('should provide set', async () => {
  const set = await state.set(fixtures.query)

  expect(fixtures.storage.find).toHaveBeenCalledWith(fixtures.query)
  expect(set).toStrictEqual(fixtures.factory.set.mock.results[0].value)
  expect(fixtures.factory.set).toHaveBeenCalledWith(fixtures.storage.find.mock.results[0].value)
})

it('should store entity', async () => {
  await state.commit(fixtures.initial)

  expect(fixtures.storage.store).toHaveBeenCalledWith(fixtures.initial.get.mock.results[0].value)
})

it('should emit', async () => {
  await state.commit(fixtures.entity)

  expect(fixtures.emitter.emit).toHaveBeenCalledWith(fixtures.entity.event.mock.results[0].value)
})

it('should not emit if state has not been changed', async () => {
  await state.commit(fixtures.unchanged)

  expect(fixtures.emitter.emit).not.toHaveBeenCalled()
})
