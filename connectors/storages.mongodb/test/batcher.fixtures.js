'use strict'

const connection = {
  connection: jest.fn(),
  link: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),

  add: jest.fn(() => true),
}

exports.connection = connection
