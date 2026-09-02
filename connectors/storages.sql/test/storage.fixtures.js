'use strict'

const { mock } = require('node:test')

// the storage constructs its client, and an arrow function cannot be constructed
const Client = mock.fn(function () {
  return {
    connection: mock.fn(),
    link: mock.fn(),
    connect: mock.fn(),
    disconnect: mock.fn(),

    insert: mock.fn(() => true),
    update: mock.fn(() => false)
  }
})

exports.Client = Client
