'use strict'

const chain = () => client

const client = {
  withSchema: jest.fn(chain),
  select: jest.fn(chain),
  insert: jest.fn(chain),
  raw: jest.fn(chain),
  destroy: jest.fn(chain),
  dst: jest.fn(chain)
}

const knex = jest.fn(chain)

exports.knex = knex
