'use strict'

const {
  to,
  from
} = require('../src/record')

describe('to', () => {
  it('should rename id to _id', () => {
    /** @type {toa.core.storages.Record} */
    const entity = {
      id: '1',
      _version: 0
    }
    const record = to(entity)

    expect(record).toMatchObject({ _id: '1' })
  })

  it('should not modify argument', () => {
    /** @type {toa.core.storages.Record} */
    const entity = {
      id: '1',
      _version: 0
    }

    to(entity)

    expect(entity).toStrictEqual({
      id: '1',
      _version: 0
    })
  })
})

describe('from', () => {
  it('should rename _id to id', () => {
    /** @type {toa.mongodb.Record} */
    const record = {
      _id: '1',
      _version: 0
    }
    const entity = from(record)

    expect(entity).toStrictEqual({
      id: '1',
      _version: 0
    })
  })

  it('should not modify argument', () => {
    /** @type {toa.mongodb.Record} */
    const record = {
      _id: '1',
      _version: 0
    }

    from(record)

    expect(record).toStrictEqual({
      _id: '1',
      _version: 0
    })
  })
})
