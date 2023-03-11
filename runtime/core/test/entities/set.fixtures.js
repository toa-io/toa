'use strict'

const { generate } = require('randomstring')

const set = [
  { get: jest.fn(() => ({ [generate()]: generate() })) },
  { get: jest.fn(() => ({ [generate()]: generate() })) },
  { get: jest.fn(() => ({ [generate()]: generate() })) }
]

exports.set = set
