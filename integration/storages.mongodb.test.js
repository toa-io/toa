'use strict'

const { generate } = require('randomstring')

const boot = require('@toa.io/boot')
const { Locator } = require('@toa.io/core')
const { newid } = require('@toa.io/libraries/generic')

const framework = require('./framework')

const connector = '@toa.io/storages.mongodb'
const locator = new Locator('balance', 'credits')

let storage

beforeAll(async () => {
  framework.env('local')

  storage = boot.storage(locator, connector)

  await expect(storage.connect()).resolves.not.toThrow()
})

afterAll(async () => {
  await storage.disconnect()

  framework.env()
})

describe('add', () => {
  const entity = { id: newid(), _version: 0, foo: generate() }

  beforeAll(async () => {
    await storage.add(entity)
  })

  it('should add', async () => {
    const record = await storage.get({ id: entity.id })

    expect(record).toStrictEqual(expect.objectContaining({ id: entity.id, foo: entity.foo }))
  })

  it('should handle on duplicate id', async () => {
    const result = await storage.add(entity)
    expect(result).toStrictEqual(false)
  })

  it('should increment version', async () => {
    const record = await storage.get({ id: entity.id })

    expect(record._version).toStrictEqual(entity._version + 1)
  })
})

describe('find', () => {
  const tag = generate()

  const entities = [{ id: newid(), _version: 0, foo: generate(), tag }, {
    id: newid(),
    _version: 0,
    foo: generate(),
    tag
  }]

  beforeAll(async () => {
    await Promise.all(entities.map((entity) => storage.add(entity)))
  })

  it('should find', async () => {
    const criteria = {
      type: 'COMPARISON',
      operator: '==',
      left: {
        type: 'SELECTOR',
        selector: 'tag'
      },
      right: {
        type: 'VALUE',
        value: tag
      }
    }

    const records = await storage.find({ criteria })

    expect(records.length).toStrictEqual(entities.length)

    entities.forEach((entity, index) => expect(records[index]).toStrictEqual(expect.objectContaining({
      id: entity.id,
      foo: entity.foo,
      tag,
      _version: 1
    })))
  })
})

describe('set', () => {
  const entity = { id: newid(), _version: 0, foo: generate() }

  beforeAll(async () => {
    await storage.add(entity)
  })

  it('should set new value', async () => {
    const replacement = { id: entity.id, _version: 1, bar: generate() }

    const result = await storage.set(replacement)
    expect(result).toStrictEqual(true)

    const state = await storage.get({ id: entity.id })

    expect(state).toStrictEqual({
      id: replacement.id,
      _version: 2,
      bar: replacement.bar
    })
  })
})

describe('store', () => {
  const entity = { id: newid(), _version: 0, foo: generate() }

  beforeAll(async () => {
    const result = await storage.store(entity)

    expect(result).toStrictEqual(true)
  })

  it('should add if new', async () => {
    const state = await storage.get({ id: entity.id })

    expect(state).toStrictEqual({
      id: entity.id,
      _version: 1,
      foo: entity.foo
    })
  })

  it('should set if existent', async () => {
    const replacement = { id: entity.id, _version: 1, bar: generate() }

    const result = await storage.store(replacement)

    expect(result).toStrictEqual(true)

    const state = await storage.get({ id: entity.id })

    expect(state).toStrictEqual({
      id: entity.id,
      _version: 2,
      bar: replacement.bar
    })
  })
})

describe('upsert', () => {
  const entity = { id: newid(), _version: 0, foo: generate() }
  const blank = { id: newid(), _version: 0 }

  beforeAll(async () => {
    const result = await storage.add(entity)

    expect(result).toStrictEqual(true)
  })

  it('should update', async () => {
    const update = { foo: generate() }

    const criteria = {
      type: 'COMPARISON',
      operator: '==',
      left: {
        type: 'SELECTOR',
        selector: 'id'
      },
      right: {
        type: 'VALUE',
        value: entity.id
      }
    }

    const result = await storage.upsert({ criteria }, update, blank)

    expect(result).toStrictEqual({
      id: entity.id,
      _version: 2,
      foo: update.foo
    })

    const state = await storage.get({ id: entity.id })

    expect(state).toStrictEqual({
      id: entity.id,
      _version: 2,
      foo: update.foo
    })
  })

  it('should add', async () => {
    const update = { foo: generate() }

    const criteria = {
      type: 'COMPARISON',
      operator: '==',
      left: {
        type: 'SELECTOR',
        selector: 'id'
      },
      right: {
        type: 'VALUE',
        value: blank.id
      }
    }

    const result = await storage.upsert({ criteria }, update, blank)

    expect(result).toStrictEqual({
      id: blank.id,
      _version: 1,
      foo: update.foo
    })

    const state = await storage.get({ id: blank.id })

    expect(state).toStrictEqual({
      id: blank.id,
      _version: 1,
      foo: update.foo
    })
  })
})
