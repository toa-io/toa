'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const { traverse } = require('../')

const origin = {
  a: {
    b: {
      c: generate()
    }
  }
}

let object

beforeEach(() => {
  object = clone(origin)
})

it('should export', () => {
  expect(traverse).toBeInstanceOf(Function)
})

it('should mutate all object type properties', () => {
  const c = generate()

  const mutate = (node) => {
    node.seen = 1

    if (node.c !== undefined) node.c = c
  }

  traverse(object, mutate)

  expect(object).toStrictEqual({
    a: {
      b: {
        c, seen: 1
      },
      seen: 1
    },
    seen: 1
  })
})

it('should mutate structure', () => {
  const mutate = (node) => {
    if (node.b !== undefined) return { ...node.b }
    if (node.c !== undefined) return node.c

    return node
  }

  const mutated = traverse(object, mutate)

  expect(mutated).toStrictEqual({ a: { c: origin.a.b.c } })
  expect(object).toStrictEqual({ a: { c: origin.a.b.c } })
})

it('should not visit arrays', () => {
  let count = 0

  object.a.d = [1, 2, 3]

  const visit = (node) => {
    count++

    return node
  }

  traverse(object, visit)

  expect(count).toStrictEqual(3)
})
