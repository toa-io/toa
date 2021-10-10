'use strict'

const { to, from } = require('../src/entry')
const { random } = require('@kookaburra/gears')

describe('to', () => {
  it('should rename id to _id', () => {
    const entry = { id: 1 }
    const result = to(entry)

    expect(result).toMatchObject({ _id: 1 })
  })

  it('should not modify argument', () => {
    const entry = { id: 1 }

    to(entry)

    expect(entry).toStrictEqual({ id: 1 })
  })

  it('should increment _version', () => {
    const entry = { _version: random() }
    const result = to(entry)

    expect(result).toMatchObject({ _version: entry._version + 1 })
  })
})

describe('from', () => {
  it('should rename _id to id', () => {
    const entry = { _id: 1 }
    const result = from(entry)

    expect(result).toStrictEqual({ id: 1 })
  })

  it('should not modify argument', () => {
    const entry = { _id: 1 }

    from(entry)

    expect(entry).toStrictEqual({ _id: 1 })
  })
})
