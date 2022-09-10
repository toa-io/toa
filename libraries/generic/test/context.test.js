'use strict'

const { generate } = require('randomstring')

const fixtures = require('./context.fixtures')
const { context, timeout } = require('../')

it('should be', () => {
  expect(context).toBeDefined()
})

it('should track context', async () => {
  const id = generate()
  const ctx = context(id)
  const v1 = { n: 0 }
  const v2 = { n: 0 }

  const p1 = ctx.apply(v1, async () => {
    await timeout(1)
    await fixtures.increment(id)

    return 1
  })

  const p2 = ctx.apply(v2, async () => {
    await timeout(1)
    await fixtures.increment(id)

    return 2
  })

  const [r1, r2] = await Promise.all([p1, p2])

  expect(v1).toStrictEqual({ n: 1 })
  expect(v2).toStrictEqual({ n: 1 })

  expect(r1).toStrictEqual(1)
  expect(r2).toStrictEqual(2)
})
