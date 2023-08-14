'use strict'

const { memo } = require('./index')

it('should memoize returned values', async () => {
  let calls = 0

  function inc () {
    calls++

    return calls
  }

  const fn = memo(inc)

  const r1 = fn()
  const r2 = fn()

  expect(r1).toStrictEqual(1)
  expect(r2).toStrictEqual(1)
  expect(calls).toStrictEqual(1)
})
