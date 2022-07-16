'use strict'

const { knex } = require('./knex.mock')
const mock = { knex }

jest.mock('knex', () => mock.knex)
const { Migration } = require('../src/migration')
const { generate } = require('randomstring')

it('should be', () => {
  expect(Migration).toBeDefined()
})

/** @type {toa.core.storages.Migration} */
let migration

let sql

const client = 'pg'
const database = generate()

const connection = {
  user: 'developer',
  password: 'secret',
  database: 'postgres'
}

beforeEach(() => {
  migration = new Migration()
  expect(knex).toHaveBeenCalledWith({ client, connection })

  sql = knex.mock.results[0].value
  expect(sql).toBeDefined()
})

describe('database', () => {
  it('should be', () => {
    expect(migration.database).toBeDefined()
  })

  it('should create database', async () => {
    await migration.database(database)

    expect(sql.raw).toHaveBeenCalledWith(`create database ${database}`)
  })

  it('should not throw if already exists', async () => {
    sql.raw.mockImplementationOnce(() => {
      const e = new Error(`create database ${database} - database "${database}" already exists`)

      e.code = '42P04'

      throw e
    })

    await expect(migration.database(database)).resolves.not.toThrow()
  })
})
