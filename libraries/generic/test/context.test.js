'use strict'

const { generate } = require('randomstring')

const fixtures = require('./context.fixtures')
const { context, timeout } = require('../')

it('should be', () => {
  expect(context).toBeDefined()
})

/** @type {symbol} */
let id

beforeEach(() => {
  id = Symbol(generate())
})

it('should return undefined on empty context', async () => {
  const storage = context(id)
  const value = storage.get()

  expect(value).toBeUndefined()
})

it('should track context', async () => {
  const storage = context(id)
  const v1 = { n: 0 }
  const v2 = { n: 0 }

  const p1 = storage.apply(v1, async () => {
    await timeout(1)
    await fixtures.increment(id)

    return 1
  })

  const p2 = storage.apply(v2, async () => {
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

it('should track nested context', async () => {
  expect.assertions(2)

  const storage = context(id)

  const outer = { a: generate() }

  await storage.apply(outer, async () => {
    const storage = context(id)
    const value = storage.get()

    const inner = { b: generate() }

    await storage.apply(inner, async () => {
      const storage = context(id)
      const value = storage.get()

      expect(value).toStrictEqual(inner)
    })

    expect(value).toStrictEqual(outer)
  })
})
