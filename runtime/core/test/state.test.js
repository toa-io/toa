'use strict'

const { State } = require('../src/state')
const fixtures = require('./state.fixtures')

let state

beforeEach(() => {
  jest.clearAllMocks()

  state = new State(fixtures.storage, fixtures.factory, fixtures.outbox)
})

it('should provide object', async () => {
  const entity = await state.object(fixtures.query)

  expect(fixtures.storage.get).toHaveBeenCalledWith(fixtures.query)
  expect(entity).toStrictEqual(fixtures.factory.object.mock.results[0].value)
  expect(fixtures.factory.object)
    .toHaveBeenCalledWith(fixtures.storage.get.mock.results[0].value, true)
})

it('should provide read-only object', async () => {
  await state.object(fixtures.query, false)

  expect(fixtures.factory.object)
    .toHaveBeenCalledWith(fixtures.storage.get.mock.results[0].value, false)
})

it('should provide read-only objects', async () => {
  await state.objects(fixtures.query, false)

  expect(fixtures.factory.objects)
    .toHaveBeenCalledWith(fixtures.storage.find.mock.results[0].value, undefined, false)
})

it('should store entity', async () => {
  await state.commit(fixtures.initial)

  expect(fixtures.storage.store).toHaveBeenCalledWith(
    fixtures.initial.get.mock.results[0].value,
    fixtures.outbox.row.mock.results[0].value)
})

it('should publish the row', async () => {
  await state.commit(fixtures.entity)

  expect(fixtures.outbox.row).toHaveBeenCalledWith(fixtures.entity.event.mock.results[0].value)
  expect(fixtures.outbox.publish).toHaveBeenCalledWith(fixtures.outbox.row.mock.results[0].value)
})

it('should not publish if the write did not happen', async () => {
  fixtures.storage.store.mockImplementationOnce(() => false)

  await state.commit(fixtures.entity)

  expect(fixtures.outbox.publish).not.toHaveBeenCalled()
})

it('should build the row before the write', async () => {
  // the storage commits the row in the same transaction, so it must already exist
  fixtures.storage.store.mockImplementationOnce((_, row) => {
    expect(row).toBeDefined()

    return true
  })

  expect.assertions(1)

  await state.commit(fixtures.entity)
})

describe('assignment', () => {
  const changeset = { query: 'q', export: () => ({ foo: 1 }) }

  it('should pass the row to upsert and publish it', async () => {
    const result = await state.apply(changeset, { foo: 1 })

    expect(fixtures.storage.upsert).toHaveBeenCalledWith(
      changeset.query, { foo: 1 }, fixtures.outbox.row.mock.results[0].value)

    expect(fixtures.outbox.publish).toHaveBeenCalledWith(fixtures.outbox.row.mock.results[0].value)
    expect(result).toStrictEqual(fixtures.storage.upsert.mock.results[0].value)
  })

  it('should fill the state a storage without the outbox left alone', async () => {
    await state.apply(changeset, { foo: 1 })

    const row = fixtures.outbox.row.mock.results[0].value

    expect(row.event.state).toStrictEqual(fixtures.storage.upsert.mock.results[0].value)
    expect(row.event.input).toStrictEqual({ foo: 1 })
  })
})
