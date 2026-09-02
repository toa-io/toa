import { it } from 'node:test'
import assert from 'node:assert/strict'

import knex from 'knex'

it('should build two queries with one schema', () => {
  const ref = knex({ client: 'pg' }).withSchema('SchemaName')

  const one = ref.select('*').from('Users').toString()
  const two = ref.select('*').from('Messages').toString()

  assert.ok(one.includes('"SchemaName"."Users"'))
  assert.ok(two.includes('"SchemaName"."Messages"'))
})
