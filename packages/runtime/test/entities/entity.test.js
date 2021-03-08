'use strict'

const { Entity } = require('../../src/entities/entity')
const fixtures = require('./entity.fixtures')

let entity

describe('Entity', () => {
  beforeEach(() => {
    entity = new Entity(fixtures.value)
  })

  it('should assign value', () => {
    expect(entity).toEqual(fixtures.value)
  })

  it('should provide enumerable _id', () => {
    expect({ ...entity }).toStrictEqual(fixtures.value)
  })

  it('should throw on extension', () => {
    const name = 'baz'

    expect(name in fixtures.value).toBe(false)
    expect(() => (entity[name] = 1)).toThrow(/object is not extensible/)
  })
})
