'use strict'

const Connection = jest.fn().mockImplementation(() => ({
  connection: jest.fn(),
  link: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),

  insert: jest.fn(() => true),
  update: jest.fn(() => false)
}))

exports.Connection = Connection
