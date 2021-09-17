'use strict'

const randomstring = require('randomstring')

const schema = { [randomstring.generate()]: randomstring.generate() }
const storage = { id: jest.fn(() => randomstring.generate()) }
const entry = { [randomstring.generate()]: randomstring.generate() }
const entries = Array.from(Array(5))
  .map((_, index) => ({ id: index, [randomstring.generate()]: randomstring.generate() }))

const Entity = jest.fn().mockImplementation(function () { this.id = randomstring.generate() })
const Entries = jest.fn().mockImplementation(function () {})

exports.schema = schema
exports.storage = storage
exports.entry = entry
exports.entries = entries
exports.mock = { Entity, Entries }
