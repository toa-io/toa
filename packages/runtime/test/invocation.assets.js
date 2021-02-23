'use strict'

module.exports.operation = {
  execute: jest.fn()
}

module.exports.schema = {
  fit: jest.fn(input => input.valid)
}

module.exports.io = {
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
