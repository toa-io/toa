import { jest } from '@jest/globals'

export const operation = {
  invoke: jest.fn()
}

export const schema = {
  fit: jest.fn(input => input.valid)
}

export const io = {
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
