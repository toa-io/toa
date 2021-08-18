'use strict'

const randomstring = require('randomstring')

const schema = { [randomstring.generate()]: randomstring.generate() }
const storage = { id: jest.fn(() => randomstring.generate()) }
const state = { [randomstring.generate()]: randomstring.generate() }

const Entity = jest.fn().mockImplementation(function () {
  this.state = undefined
})

exports.schema = schema
exports.storage = storage
exports.state = state
exports.mock = { Entity }
