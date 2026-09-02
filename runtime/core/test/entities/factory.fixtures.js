'use strict'

const { mock } = require('node:test')

const randomstring = require('randomstring')

const schema = { [randomstring.generate()]: randomstring.generate() }
const storage = { id: mock.fn(() => randomstring.generate()) }
const entity = { [randomstring.generate()]: randomstring.generate() }
const set = Array.from(Array(5))
  .map((_, index) => ({ id: index, [randomstring.generate()]: randomstring.generate() }))

// node:test records a mock's calls but not the instances it constructed
const entities = []

const Entity = mock.fn(function () {
  this.id = randomstring.generate()
  entities.push(this)
})

const EntitySet = mock.fn(function () {})

exports.schema = schema
exports.storage = storage
exports.entity = entity
exports.set = set
exports.mock = { Entity, EntitySet }
exports.entities = entities
