'use strict'

const knex = require('knex')

it('should build two queries with one schema', () => {
  const ref = knex({ client: 'pg' }).withSchema('SchemaName')

  const one = ref.select('*').from('Users').toString()
  const two = ref.select('*').from('Messages').toString()

  expect(one).toStrictEqual(expect.stringContaining('"SchemaName"."Users"'))
  expect(two).toStrictEqual(expect.stringContaining('"SchemaName"."Messages"'))
})
