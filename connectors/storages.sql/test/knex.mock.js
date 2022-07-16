'use strict'

const client = {
  withSchema: jest.fn(() => client),
  select: jest.fn(() => client),
  insert: jest.fn(() => client)
}

const knex = jest.fn(() => client)

exports.knex = knex
