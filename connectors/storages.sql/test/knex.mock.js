'use strict'

const chain = () => client

let result = []

const client = {
  withSchema: jest.fn(chain),
  select: jest.fn(() => result),
  from: jest.fn(chain),
  where: jest.fn(chain),
  insert: jest.fn(chain),
  into: jest.fn(),
  raw: jest.fn(chain),
  destroy: jest.fn(chain)
}

const knex = jest.fn(chain)

knex.result = (value) => (result = value)

exports.knex = knex
