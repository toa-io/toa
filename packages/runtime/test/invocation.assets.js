'use strict'

const operation = {
  execute: jest.fn()
}

const schema = {
  fit: jest.fn(input => input.valid)
}

const io = {
  valid: {
    input: {
      valid: true
    },
    close: jest.fn()
  },
  invalid: {
    input: {
      valid: false
    },
    error: {}
  }
}

exports.operation = operation
exports.schema = schema
exports.io = io
