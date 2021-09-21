'use strict'

const { difference } = require('../src/difference')

it('should return object difference', () => {
  const a = {
    foo: 'old',
    bar: {
      baz: 1,
      ok: 1
    }
  }

  const b = {
    foo: 'new',
    bar: {
      baz: 2,
      ok: 1
    }
  }

  const diff = difference(a, b)

  expect(diff).toStrictEqual({
    foo: 'new',
    bar: {
      baz: 2
    }
  })
})
