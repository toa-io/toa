'use strict'

const { generate } = require('randomstring')

const connection = {
  table: generate(),
  connection: jest.fn(),
  link: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),

  insert: jest.fn(() => true),
  update: jest.fn(() => true)
}

exports.connection = connection
