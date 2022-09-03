'use strict'

const { context, timeout } = require('../')

it('should be', () => {
  expect(context).toBeDefined()
})

it('should track context', async () => {
  const c1 = context('one')
  const c2 = context('two')
  const v1 = { n: 0 }
  const v2 = { n: 0 }

  const increment = (id) => {
    const storage = context(id)
    const value = storage.get()

    value.n++
  }

  const p1 = c1.apply(v1, async () => {
    await timeout(1)
    increment('one')
  })

  const p2 = c2.apply(v2, async () => {
    await timeout(1)
    increment('two')
  })

  await Promise.all([p1, p2])

  expect(v1).toStrictEqual({ n: 1 })
  expect(v2).toStrictEqual({ n: 1 })
})
