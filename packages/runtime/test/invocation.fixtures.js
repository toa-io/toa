'use strict'

const operation = {
  execute: jest.fn()
}

const schema = {
  fit: jest.fn(input => ({
    ok: input.valid,
    errors: input.valid ? undefined : [{ error: 1 }]
  }))
}

const io = {
  valid: {
    input: {
      valid: true
    },
    close: jest.fn(),
    freeze: jest.fn()
  },
  invalid: {
    input: {
      valid: false
    },
    error: {},
    close: jest.fn(),
    freeze: jest.fn()
  }
}

exports.operation = operation
exports.schema = schema
exports.io = io
