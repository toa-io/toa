'use strict'

const { Storage } = require('../src/storage')

let collection
let storage

beforeEach(async () => {
  collection = {
    collectionName: 'test',
    findOne: jest.fn(async () => null),
    find: jest.fn(() => ({ stream: () => null }))
  }

  const client = {
    collection,
    link: () => null
  }

  storage = new Storage(client, { schema: { properties: {} } })

  await storage.open()
})

describe('get', () => {
  it('should filter deleted', async () => {
    await storage.get({})

    expect(collection.findOne).toHaveBeenCalledWith({ _deleted: null }, {})
  })

  it('should filter deleted with sort', async () => {
    await storage.get({ options: { sort: [['_created', 'desc']] } })

    expect(collection.findOne)
      .toHaveBeenCalledWith({ _deleted: null }, { sort: [['_created', -1]] })
  })

  it('should not filter deleted if queried by id', async () => {
    const id = 'bcb6780f50e243348cad40ed6b5ef575'

    await storage.get({ id })

    expect(collection.findOne).toHaveBeenCalledWith({ _id: id }, {})
  })

  it('should not filter deleted if requested', async () => {
    await storage.get({ options: { deleted: true } })

    expect(collection.findOne).toHaveBeenCalledWith({}, {})
  })
})

describe('set', () => {
  it('should lift the tombstone', async () => {
    collection.findOneAndReplace = jest.fn(async () => ({}))

    const id = 'bcb6780f50e243348cad40ed6b5ef575'

    await storage.set({ id, _version: 3, _deleted: 1786625599108 })

    expect(collection.findOneAndReplace)
      .toHaveBeenCalledWith({ _id: id, _version: 2 }, { _id: id, _version: 3, _deleted: null })
  })
})

describe('stream', () => {
  it('should filter deleted', async () => {
    await storage.stream()

    expect(collection.find).toHaveBeenCalledWith({ _deleted: null }, {})
  })

  it('should filter deleted with sort', async () => {
    await storage.stream({ options: { sort: [['_created', 'desc']] } })

    expect(collection.find)
      .toHaveBeenCalledWith({ _deleted: null }, { sort: [['_created', -1]] })
  })

  it('should not filter deleted if requested', async () => {
    await storage.stream({ options: { deleted: true } })

    expect(collection.find).toHaveBeenCalledWith({}, {})
  })
})
