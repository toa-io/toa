import { Query } from './Query'
import { type Parameter } from './Match'
import type * as syntax from './syntax'

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

  expect(result.criteria).toStrictEqual('(foo==1);(bar==2;baz==3);(qux==4)')
})
