'use strict'

const { generate } = require('randomstring')

const entries = [
  { get: jest.fn(() => ({ [generate()]: generate() })) },
  { get: jest.fn(() => ({ [generate()]: generate() })) },
  { get: jest.fn(() => ({ [generate()]: generate() })) }
]

exports.entries = entries
