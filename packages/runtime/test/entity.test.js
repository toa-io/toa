'use strict'

const { Entity } = require('../src/entities/entity')
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

  describe('_deleted', () => {
    it('should expose _deleted as boolean', () => {
      expect(entity._deleted).toBeFalsy()
    })
  })
})

describe('Factory', () => {

})
