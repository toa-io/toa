'use strict'

const { newid } = require('../src')

it('should return id', () => {
  const id = newid()

  expect(id).toStrictEqual(expect.any(String))
  expect(id.length).toBe(32)
})
