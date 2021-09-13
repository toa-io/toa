'use strict'

const randomstring = require('randomstring')

const set = [
  { get: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() })) },
  { get: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() })) },
  { get: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() })) }
]

exports.set = set
