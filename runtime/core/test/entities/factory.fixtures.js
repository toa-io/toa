'use strict'

const randomstring = require('randomstring')

const schema = { [randomstring.generate()]: randomstring.generate() }
const storage = { id: jest.fn(() => randomstring.generate()) }
const entity = { [randomstring.generate()]: randomstring.generate() }
const set = Array.from(Array(5))
  .map((_, index) => ({ id: index, [randomstring.generate()]: randomstring.generate() }))

const Entity = jest.fn().mockImplementation(function () { this.id = randomstring.generate() })
const EntitySet = jest.fn().mockImplementation(function () {})

exports.schema = schema
exports.storage = storage
exports.entity = entity
exports.set = set
exports.mock = { Entity, EntitySet }
