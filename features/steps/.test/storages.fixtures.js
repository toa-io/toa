'use strict'

const sql = {
  Factory: jest.fn().mockImplementation(() => ({
    migration: jest.fn(() => ({
      database: jest.fn()
    }))
  }))
}

exports.mock = { sql }
