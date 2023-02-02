'use strict'

const { reduce } = require('../src')

it('should be', async () => {
  expect(reduce).toBeDefined()
})

it('should reduce to object', async () => {
  const items = [1, 2, 3]
  const reducer = (acc, item) => (acc.a = acc.a === undefined ? item : acc.a + item)
  const result = reduce(items, reducer)

  expect(result.a).toStrictEqual(6)
})
