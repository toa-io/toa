'use strict'

const { generate } = require('randomstring')

const connection = {
  connection: jest.fn(),
  link: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),

  insert: jest.fn(() => true),
  update: jest.fn(() => true)
}

const pointer = {
  table: generate()
}

exports.connection = connection
exports.pointer = pointer
