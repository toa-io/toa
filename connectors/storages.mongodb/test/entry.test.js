'use strict'

const { to, from } = require('../src/entry')

describe('to', () => {
  it('should rename id to _id', () => {
    const entry = { id: 1 }

    const result = to(entry)

    expect(result).toStrictEqual({ _id: 1 })
    expect(entry).toStrictEqual({ _id: 1 })
  })
})

describe('from', () => {
  it('should rename _id to id', () => {
    const entry = { _id: 1 }

    const result = from(entry)

    expect(result).toStrictEqual({ id: 1 })
    expect(entry).toStrictEqual({ id: 1 })
  })
})
