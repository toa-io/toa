import { Query } from './Query'
import { type Parameter, type syntax } from './RTD'

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

  expect(result.criteria).toStrictEqual('(bar==2;baz==3);(foo==1);(qux==4)')
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

  expect(result.criteria).toBeUndefined()
  expect(result.id).toStrictEqual(id)
})
