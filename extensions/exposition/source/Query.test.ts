import { it } from 'node:test'
import assert from 'node:assert/strict'

import { Query } from './Query.js'
import { type Parameter, type syntax } from './RTD/index.js'

it('should combine request criteria', async () => {
  const query: syntax.Query = {
    criteria: 'foo==1;',
    omit: { range: [0, 1] },
    limit: { range: [0, 1] }
  }

  const parameters: Parameter[] = [
    { name: 'bar', value: '2' },
    { name: 'baz', value: '3' }
  ]

  const instance = new Query(query)
  const result = instance.fit({ criteria: 'qux==4' }, parameters)

  assert.deepStrictEqual(result.query!.criteria, '(bar=="2";baz=="3");(foo==1);(qux==4)')
})

it('should quote parameter values', async () => {
  const query: syntax.Query = {
    omit: { range: [0, 1] },
    limit: { range: [0, 1] }
  }

  const parameters: Parameter[] = [{ name: 'user', value: 'me"),(user=="victim' }]

  const instance = new Query(query)
  const result = instance.fit({}, parameters)

  assert.deepStrictEqual(result.query!.criteria, '(user=="me\\"),(user==\\"victim")')
})

it('should set id parameter as query.id', async () => {
  const query: syntax.Query = {
    omit: { range: [0, 1] },
    limit: { range: [0, 1] }
  }

  const id = '87782631058445da81cb82f78b20c223'

  const parameters: Parameter[] = [{ name: 'id', value: id }]

  const instance = new Query(query)
  const result = instance.fit({}, parameters)

  assert.strictEqual(result.query!.criteria, undefined)
  assert.deepStrictEqual(result.query!.id, id)
})
