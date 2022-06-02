'use strict'

const { to, from } = require('../src/record')
const { random } = require('@toa.io/gears')

describe('to', () => {
  it('should rename id to _id', () => {
    const entity = { id: '1', _version: 0 }
    const record = to(entity)

    expect(record).toMatchObject({ _id: '1' })
  })

  it('should not modify argument', () => {
    const entity = { id: '1', _version: 0 }

    to(entity)

    expect(entity).toStrictEqual({ id: '1', _version: 0 })
  })

  it('should increment _version', () => {
    const entity = { id: '1', _version: random() }
    const record = to(entity)

    expect(record).toMatchObject({ _version: entity._version + 1 })
  })
})

describe('from', () => {
  it('should rename _id to id', () => {
    const record = { _id: '1', _version: 0 }
    const entity = from(record)

    expect(entity).toStrictEqual({ id: '1', _version: 0 })
  })

  it('should not modify argument', () => {
    const record = { _id: '1', _version: 0 }

    from(record)

    expect(record).toStrictEqual({ _id: '1', _version: 0 })
  })
})
