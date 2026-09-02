'use strict'

const { mock } = require('node:test')

const chain = () => client

let result = []

const client = {
  withSchema: mock.fn(chain),
  select: mock.fn(() => result),
  from: mock.fn(chain),
  where: mock.fn(chain),
  insert: mock.fn(chain),
  into: mock.fn(),
  raw: mock.fn(chain),
  destroy: mock.fn(chain)
}

const knex = mock.fn(chain)

knex.result = (value) => (result = value)

exports.knex = knex
