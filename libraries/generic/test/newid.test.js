'use strict'

const { newid } = require('../source')

it('should return id', () => {
  const id = newid()

  expect(id).toStrictEqual(expect.any(String))
  expect(id.length).toBe(32)
})
