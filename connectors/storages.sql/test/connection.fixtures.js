'use strict'

const knex = jest.fn(() => ({ withSchema: jest.fn() }))

exports.mock = { knex }
