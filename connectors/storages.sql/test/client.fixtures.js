'use strict'

const { mock } = require('node:test')

const { generate } = require('randomstring')

const connection = {
  table: generate(),
  connection: mock.fn(),
  link: mock.fn(),
  connect: mock.fn(),
  disconnect: mock.fn(),

  insert: mock.fn(() => true),
  update: mock.fn(() => true)
}

exports.connection = connection
