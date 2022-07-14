'use strict'

const { to, from } = require('../src/record')
const { random } = require('@toa.io/libraries/generic')

describe('to', () => {
  it('should rename id to _id', () => {
    /** @type {toa.core.storages.Entity} */
    const entity = { id: '1', _version: 0 }
    const record = to(entity)

    expect(record).toMatchObject({ _id: '1' })
  })

  it('should not modify argument', () => {
    /** @type {toa.core.storages.Entity} */
    const entity = { id: '1', _version: 0 }

    to(entity)

    expect(entity).toStrictEqual({ id: '1', _version: 0 })
  })

  it('should increment _version', () => {
    /** @type {toa.core.storages.Entity} */
    const entity = { id: '1', _version: random() }
    const record = to(entity)

    expect(record).toMatchObject({ _version: entity._version + 1 })
  })
})

describe('from', () => {
  it('should rename _id to id', () => {
    /** @type {toa.mongodb.Record} */
    const record = { _id: '1', _version: 0 }
    const entity = from(record)

    expect(entity).toStrictEqual({ id: '1', _version: 0 })
  })

  it('should not modify argument', () => {
    /** @type {toa.mongodb.Record} */
    const record = { _id: '1', _version: 0 }

    from(record)

    expect(record).toStrictEqual({ _id: '1', _version: 0 })
  })
})
