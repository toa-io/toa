'use strict'

const { mock } = require('node:test')

const { generate } = require('randomstring')

const set = [
  { get: mock.fn(() => ({ [generate()]: generate() })) },
  { get: mock.fn(() => ({ [generate()]: generate() })) },
  { get: mock.fn(() => ({ [generate()]: generate() })) }
]

exports.set = set
