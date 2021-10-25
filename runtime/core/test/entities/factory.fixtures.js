'use strict'

const randomstring = require('randomstring')

const schema = { [randomstring.generate()]: randomstring.generate() }
const storage = { id: jest.fn(() => randomstring.generate()) }
const entry = { [randomstring.generate()]: randomstring.generate() }
const list = Array.from(Array(5))
  .map((_, index) => ({ id: index, [randomstring.generate()]: randomstring.generate() }))

const Entity = jest.fn().mockImplementation(function () { this.id = randomstring.generate() })
const List = jest.fn().mockImplementation(function () {})

exports.schema = schema
exports.storage = storage
exports.entry = entry
exports.list = list
exports.mock = { Entity, List }
